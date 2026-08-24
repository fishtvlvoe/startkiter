import { createEcpayInvoiceProvider, createEzpayInvoiceProvider, type InvoiceProvider, type InvoiceProviderConfig } from "@startkiter/payments";
import { db } from "@startkiter/database";
import { createDecipheriv, createHash } from "node:crypto";

export const EINVOICE_SETTING_ID = "einvoice";

export type InvoiceProviderName = "ecpay" | "ezpay";

export type InvoiceSettings = {
	provider: InvoiceProviderName;
	merchantId: string;
	hashKey: string;
	hashIV: string;
	testMode: boolean;
	sellerName: string;
	sellerTaxId: string;
	autoIssueEnabled: boolean;
	einvoiceEnabled: boolean;
};

export const EMPTY_INVOICE_SETTINGS: InvoiceSettings = {
	provider: "ecpay",
	merchantId: "",
	hashKey: "",
	hashIV: "",
	testMode: true,
	sellerName: "",
	sellerTaxId: "",
	autoIssueEnabled: false,
	einvoiceEnabled: false,
};

function decryptSettingsJson(payload: string, secret: string): string | null {
	if (!secret.trim() || !payload.startsWith("v1:")) return null;
	const parts = payload.split(":");
	if (parts.length !== 4) return null;
	try {
		const decipher = createDecipheriv(
			"aes-256-gcm",
			createHash("sha256").update(secret, "utf8").digest(),
			Buffer.from(parts[1] ?? "", "base64"),
		);
		decipher.setAuthTag(Buffer.from(parts[2] ?? "", "base64"));
		return Buffer.concat([decipher.update(Buffer.from(parts[3] ?? "", "base64")), decipher.final()]).toString("utf8");
	} catch {
		return null;
	}
}

function parseSettings(json: string): InvoiceSettings | null {
	try {
		const parsed: unknown = JSON.parse(json);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
		const row = parsed as Record<string, unknown>;
		return {
			provider: row.provider === "ezpay" ? "ezpay" : "ecpay",
			merchantId: typeof row.merchantId === "string" ? row.merchantId : "",
			hashKey: typeof row.hashKey === "string" ? row.hashKey : "",
			hashIV: typeof row.hashIV === "string" ? row.hashIV : "",
			testMode: typeof row.testMode === "boolean" ? row.testMode : true,
			sellerName: typeof row.sellerName === "string" ? row.sellerName : "",
			sellerTaxId: typeof row.sellerTaxId === "string" ? row.sellerTaxId : "",
			autoIssueEnabled: typeof row.autoIssueEnabled === "boolean" ? row.autoIssueEnabled : false,
			einvoiceEnabled: typeof row.einvoiceEnabled === "boolean" ? row.einvoiceEnabled : false,
		};
	} catch {
		return null;
	}
}

export async function readInvoiceSettingsPlain(): Promise<InvoiceSettings | null> {
	const secret = process.env.SETTINGS_ENCRYPTION_KEY ?? "";
	if (!secret.trim()) return null;
	try {
		const row = await db.siteSetting.findUnique({ where: { id: EINVOICE_SETTING_ID } });
		if (!row) return null;
		const json = decryptSettingsJson(row.ciphertext, secret);
		return json ? parseSettings(json) : null;
	} catch {
		return null;
	}
}

export async function getInvoiceSettings(): Promise<InvoiceSettings> {
	return (await readInvoiceSettingsPlain()) ?? { ...EMPTY_INVOICE_SETTINGS };
}

export async function getInvoiceProvider(): Promise<InvoiceProvider | null> {
	const settings = await getInvoiceSettings();
	if (!settings.merchantId || !settings.hashKey || !settings.hashIV) return null;
	const config: InvoiceProviderConfig = {
		merchantId: settings.merchantId,
		hashKey: settings.hashKey,
		hashIV: settings.hashIV,
		testMode: settings.testMode,
	};
	return settings.provider === "ezpay" ? createEzpayInvoiceProvider(config) : createEcpayInvoiceProvider(config);
}
