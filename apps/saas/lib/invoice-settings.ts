import { db } from "@startkiter/database";
import {
	EINVOICE_SETTING_ID,
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

export async function writeInvoiceSettings(args: {
	patch: InvoiceSettingsPatch;
	actorUserId: string;
}): Promise<{ ok: true; settings: InvoiceSettings } | { ok: false; error: string }> {
	if (args.patch.clear) {
		try {
			await db.siteSetting.deleteMany({ where: { id: EINVOICE_SETTING_ID } });
			return { ok: true, settings: { ...EMPTY_INVOICE_SETTINGS } };
		} catch {
			return { ok: false, error: "settings_unavailable" };
		}
	}

	const invalid = validateInvoiceSettingsPatch(args.patch);
	if (invalid) return { ok: false, error: invalid };
	const secret = encryptionKey();
	if (!secret.trim()) return { ok: false, error: "encryption_key_required" };
	const settings = mergeSettings(await getInvoiceSettings(), args.patch);
	if (!settings.merchantId || !settings.hashKey || !settings.hashIV || !settings.sellerName || !settings.sellerTaxId) {
		return { ok: false, error: "incomplete_invoice_settings" };
	}

	try {
		const ciphertext = encryptSettingsJson(JSON.stringify(settings), secret);
		await db.siteSetting.upsert({
			where: { id: EINVOICE_SETTING_ID },
			create: { id: EINVOICE_SETTING_ID, ciphertext, updatedBy: args.actorUserId },
			update: { ciphertext, updatedBy: args.actorUserId },
		});
		return { ok: true, settings };
	} catch {
		return { ok: false, error: "settings_unavailable" };
	}
}
