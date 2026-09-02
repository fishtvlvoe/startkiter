import { createEcpayInvoiceProvider, createEzpayInvoiceProvider, type InvoiceProvider, type InvoiceProviderConfig } from "@startkiter/payments";
import { db, type Prisma } from "@startkiter/database";
import { createDecipheriv, createHash } from "node:crypto";

export const EINVOICE_SETTING_ID = "einvoice";
export const EINVOICE_OPERATION_LOCK_ID = "startkiter:einvoice-operation";
/** 發票作業租約（作廢／折讓／開立重試共用），逾時才可搶回 */
export const INVOICE_OPERATION_LEASE_MS = 60_000;
const EINVOICE_PROVIDER_TIMEOUT_MS = 15_000;

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

export function isInvoiceProviderName(value: string): value is InvoiceProviderName {
	return value === "ecpay" || value === "ezpay";
}

export function isValidInvoiceCredentialLength(settings: Pick<InvoiceSettings, "provider" | "hashKey" | "hashIV">): boolean {
	const hashKeyLength = settings.provider === "ecpay" ? 16 : 32;
	return settings.hashKey.length === hashKeyLength && settings.hashIV.length === 16;
}

export async function withInvoiceOperationLock<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
	return db.$transaction(
		async (tx) => {
			await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${EINVOICE_OPERATION_LOCK_ID}, 0))`;
			return callback(tx);
		},
		{ maxWait: 10_000, timeout: 30_000 },
	);
}

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

type InvoiceSettingsClient = Pick<Prisma.TransactionClient, "siteSetting">;

export async function readInvoiceSettingsPlain(client: InvoiceSettingsClient = db): Promise<InvoiceSettings | null> {
	const secret = process.env.SETTINGS_ENCRYPTION_KEY ?? "";
	if (!secret.trim()) return null;
	try {
		const row = await client.siteSetting.findUnique({ where: { id: EINVOICE_SETTING_ID } });
		if (!row) return null;
		const json = decryptSettingsJson(row.ciphertext, secret);
		return json ? parseSettings(json) : null;
	} catch {
		return null;
	}
}

export async function getInvoiceSettings(client: InvoiceSettingsClient = db): Promise<InvoiceSettings> {
	return (await readInvoiceSettingsPlain(client)) ?? { ...EMPTY_INVOICE_SETTINGS };
}

export function createInvoiceProvider(settings: InvoiceSettings): InvoiceProvider | null {
	if (!settings.merchantId || !isValidInvoiceCredentialLength(settings)) return null;
	const config: InvoiceProviderConfig = {
		merchantId: settings.merchantId,
		hashKey: settings.hashKey,
		hashIV: settings.hashIV,
		testMode: settings.testMode,
		timeoutMs: EINVOICE_PROVIDER_TIMEOUT_MS,
	};
	return settings.provider === "ezpay" ? createEzpayInvoiceProvider(config) : createEcpayInvoiceProvider(config);
}

export async function getInvoiceProvider(expectedProvider?: InvoiceProviderName): Promise<InvoiceProvider | null> {
	const settings = await getInvoiceSettings();
	if (expectedProvider && settings.provider !== expectedProvider) return null;
	return createInvoiceProvider(settings);
}
