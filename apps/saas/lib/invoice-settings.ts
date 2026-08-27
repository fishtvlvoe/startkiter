import { db } from "@startkiter/database";
import {
	EINVOICE_SETTING_ID,
	isValidInvoiceCredentialLength,
	withInvoiceOperationLock,
	EMPTY_INVOICE_SETTINGS,
	getInvoiceSettings,
	type InvoiceProviderName,
	type InvoiceSettings,
} from "@startkiter/api/modules/course/lib/invoice-settings";

import { encryptSettingsJson } from "./settings-crypto";

export { EINVOICE_SETTING_ID, getInvoiceProvider, getInvoiceSettings } from "@startkiter/api/modules/course/lib/invoice-settings";
export type { InvoiceProviderName, InvoiceSettings } from "@startkiter/api/modules/course/lib/invoice-settings";

export type InvoiceSettingsPatch = Partial<InvoiceSettings> & { clear?: boolean };

function encryptionKey(): string {
	return process.env.SETTINGS_ENCRYPTION_KEY ?? "";
}

export function validateInvoiceSettingsPatch(patch: InvoiceSettingsPatch): string | null {
	if (patch.provider !== undefined && patch.provider !== "ecpay" && patch.provider !== "ezpay") return "invalid_provider";
	if (patch.merchantId !== undefined && !patch.merchantId.trim()) return "invalid_merchant_id";
	if (patch.hashKey !== undefined && patch.hashKey !== "" && patch.hashKey.length !== 16 && patch.hashKey.length !== 32) return "invalid_hash_key";
	if (patch.hashIV !== undefined && patch.hashIV !== "" && patch.hashIV.length !== 16) return "invalid_hash_iv";
	return null;
}

function mergeSettings(existing: InvoiceSettings, patch: InvoiceSettingsPatch): InvoiceSettings {
	return {
		provider: (patch.provider as InvoiceProviderName | undefined) ?? existing.provider,
		merchantId: patch.merchantId?.trim() || existing.merchantId,
		hashKey: patch.hashKey || existing.hashKey,
		hashIV: patch.hashIV || existing.hashIV,
		testMode: patch.testMode ?? existing.testMode,
		sellerName: patch.sellerName?.trim() ?? existing.sellerName,
		sellerTaxId: patch.sellerTaxId?.trim() ?? existing.sellerTaxId,
		autoIssueEnabled: patch.autoIssueEnabled ?? existing.autoIssueEnabled,
		einvoiceEnabled: patch.einvoiceEnabled ?? existing.einvoiceEnabled,
	};
}

type InvoiceActionClient = Pick<import("@startkiter/database").Prisma.TransactionClient, "invoice">;

async function hasPendingInvoiceOperations(client: InvoiceActionClient): Promise<boolean | null> {
	try {
		const invoices = await client.invoice.findMany({
			where: { OR: [{ status: { in: ["PENDING", "FAILED"] } }, { attentionReason: { not: null } }] },
			select: { id: true },
			take: 1,
		});
		return invoices.length > 0;
	} catch {
		return null;
	}
}

async function hasActionableInvoices(client: InvoiceActionClient): Promise<boolean | null> {
	try {
		const invoices = await client.invoice.findMany({
			where: { status: { in: ["ISSUED", "ALLOWANCE"] } },
			select: { amount: true, allowanceTotal: true },
		});
		return invoices.some((invoice) => invoice.allowanceTotal < invoice.amount);
	} catch {
		return null;
	}
}

function invoiceSettingsChanged(before: InvoiceSettings, after: InvoiceSettings): boolean {
	return Object.keys(before).some((key) => before[key as keyof InvoiceSettings] !== after[key as keyof InvoiceSettings]);
}

export async function writeInvoiceSettings(args: {
	patch: InvoiceSettingsPatch;
	actorUserId: string;
}): Promise<{ ok: true; settings: InvoiceSettings } | { ok: false; error: string }> {
	const invalid = validateInvoiceSettingsPatch(args.patch);
	if (invalid) return { ok: false, error: invalid };
	const secret = encryptionKey();
	if (!secret.trim()) return { ok: false, error: "encryption_key_required" };

	try {
		return await withInvoiceOperationLock(async (tx) => {
			if (args.patch.clear) {
				const hasPending = await hasPendingInvoiceOperations(tx);
				if (hasPending === null) return { ok: false, error: "settings_unavailable" };
				if (hasPending) return { ok: false, error: "invoice_settings_clear_blocked_pending_operations" };
				const hasActionable = await hasActionableInvoices(tx);
				if (hasActionable === null) return { ok: false, error: "settings_unavailable" };
				if (hasActionable) return { ok: false, error: "settings_clear_blocked_existing_actionable_invoices" };
				await tx.siteSetting.deleteMany({ where: { id: EINVOICE_SETTING_ID } });
				return { ok: true, settings: { ...EMPTY_INVOICE_SETTINGS } };
			}

			const existing = await getInvoiceSettings(tx);
			const settings = mergeSettings(existing, args.patch);
			if (!settings.merchantId || !settings.hashKey || !settings.hashIV || !settings.sellerName || !settings.sellerTaxId) {
				return { ok: false, error: "incomplete_invoice_settings" };
			}
			if (!isValidInvoiceCredentialLength(settings)) return { ok: false, error: "invalid_invoice_credentials" };
			if (invoiceSettingsChanged(existing, settings)) {
				const hasPending = await hasPendingInvoiceOperations(tx);
				if (hasPending === null) return { ok: false, error: "settings_unavailable" };
				if (hasPending) return { ok: false, error: "invoice_settings_change_blocked_pending_operations" };
				const hasActionable = await hasActionableInvoices(tx);
				if (hasActionable === null) return { ok: false, error: "settings_unavailable" };
				if (hasActionable) {
					return {
						ok: false,
						error: existing.provider !== settings.provider
							? "provider_switch_blocked_existing_issued_invoices"
							: "invoice_settings_change_blocked_existing_actionable_invoices",
					};
				}
			}

			const ciphertext = encryptSettingsJson(JSON.stringify(settings), secret);
			await tx.siteSetting.upsert({
				where: { id: EINVOICE_SETTING_ID },
				create: { id: EINVOICE_SETTING_ID, ciphertext, updatedBy: args.actorUserId },
				update: { ciphertext, updatedBy: args.actorUserId },
			});
			return { ok: true, settings };
		});
	} catch {
		return { ok: false, error: "settings_unavailable" };
	}
}
