import { createDecipheriv, createHash } from "node:crypto";
import { db } from "@startkiter/database";
import {
	createPayUniSubscriptionGateway,
	resolvePayUniCredentials,
	type PayUniEnv,
	type SubscriptionGateway,
} from "@startkiter/payments";

type PayuniSettings = {
	merchantId?: string;
	hashKey?: string;
	hashIV?: string;
	apiUrl?: string;
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
		return Buffer.concat([
			decipher.update(Buffer.from(parts[3] ?? "", "base64")),
			decipher.final(),
		]).toString("utf8");
	} catch {
		return null;
	}
}

async function readPayuniSettings(): Promise<PayuniSettings | null> {
	const secret = process.env.SETTINGS_ENCRYPTION_KEY ?? "";
	if (!secret.trim()) return null;

	try {
		const row = await db.siteSetting.findUnique({ where: { id: "payuni" } });
		if (!row) return null;
		const plaintext = decryptSettingsJson(row.ciphertext, secret);
		if (!plaintext) return null;
		const parsed: unknown = JSON.parse(plaintext);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
		const values = parsed as Record<string, unknown>;
		return {
			merchantId: typeof values.merchantId === "string" ? values.merchantId : "",
			hashKey: typeof values.hashKey === "string" ? values.hashKey : "",
			hashIV: typeof values.hashIV === "string" ? values.hashIV : "",
			apiUrl: typeof values.apiUrl === "string" ? values.apiUrl : "",
		};
	} catch {
		return null;
	}
}

export async function getPayUniSubscriptionGateway(): Promise<SubscriptionGateway | null> {
	const settings = await readPayuniSettings();
	const credentials = resolvePayUniCredentials({
		readSettings: () => settings,
		env: process.env as PayUniEnv,
	});
	return credentials ? createPayUniSubscriptionGateway(credentials) : null;
}

export function resolveSubscriptionBaseUrl(requestUrl?: string): string | null {
	const fromRequest = Boolean(requestUrl?.trim());
	const raw = requestUrl?.trim() || process.env.BETTER_AUTH_URL?.trim();
	if (!raw) return null;
	try {
		const url = new URL(raw);
		const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
		if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null;
		if (fromRequest) return url.origin;
		url.hash = "";
		url.search = "";
		url.pathname = url.pathname.replace(/\/+$/, "");
		return url.toString().replace(/\/$/, "");
	} catch {
		return null;
	}
}
