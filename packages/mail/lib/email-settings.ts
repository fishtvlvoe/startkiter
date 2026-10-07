import { logger } from "@startkiter/logs";

import {
	decryptSettingsJson,
	encryptSettingsJson,
	maskSecret,
} from "../../api/modules/course/lib/settings-crypto";
import { createSmtpSender } from "../provider/nodemailer";
import { createResendSender } from "../provider/resend";
import { createToSendSender } from "../provider/tosend";
import { createZSendSender } from "../provider/zsend";
import type { SendEmailHandler } from "../types";

async function getDb() {
	try {
		const mod = await import("@startkiter/database");
		return mod.db;
	} catch {
		return null;
	}
}

export const EMAIL_SETTINGS_ID = "email-provider-config";

export type EmailProviderType = "zsend" | "tosend" | "resend" | "smtp";

export type StoredEmailSettings = {
	provider?: EmailProviderType;
	zsendApiKey?: string;
	zsendDomain?: string;
	tosendApiKey?: string;
	tosendApiBaseUrl?: string;
	resendApiKey?: string;
	smtpHost?: string;
	smtpPort?: number;
	smtpUser?: string;
	smtpPass?: string;
	smtpSecure?: boolean;
	senderName?: string;
	fromEmail?: string;
	newsletterSenderName?: string;
	newsletterReplyTo?: string;
	footerCompany?: string;
	footerAddress?: string;
	footerEmail?: string;
	newsletterRatePerMinute?: number;
};

export type EmailSettingsSummary = {
	provider?: EmailProviderType;
	activeProvider: { name: EmailProviderType; source: "stored" | "environment" } | null;
	hasZsendApiKey: boolean;
	zsendApiKeyHint?: string;
	zsendDomain?: string;
	hasTosendApiKey: boolean;
	tosendApiKeyHint?: string;
	tosendApiBaseUrl?: string;
	hasResendApiKey: boolean;
	resendApiKeyHint?: string;
	smtpHost?: string;
	smtpPort?: number;
	hasSmtpPass: boolean;
	smtpPassHint?: string;
	smtpUser?: string;
	smtpSecure?: boolean;
	senderName?: string;
	fromEmail?: string;
	newsletterSenderName?: string;
	newsletterReplyTo?: string;
	footerCompany?: string;
	footerAddress?: string;
	footerEmail?: string;
	newsletterRatePerMinute?: number;
};

const CREDENTIAL_KEYS = ["tosendApiKey", "zsendApiKey", "resendApiKey", "smtpPass"] as const;

const CACHE_TTL_MS = 30_000;
let cachedSettings: StoredEmailSettings | null = null;
let cacheExpiresAt = 0;

export function clearEmailSettingsCache(): void {
	cachedSettings = null;
	cacheExpiresAt = 0;
}

export function getCachedEmailSettings(): StoredEmailSettings {
	return cachedSettings ?? {};
}

export async function readEmailSettings(): Promise<StoredEmailSettings> {
	const now = Date.now();

	if (cachedSettings !== null && now < cacheExpiresAt) {
		return cachedSettings;
	}

	const db = await getDb();
	if (!db) {
		cachedSettings = {};
		cacheExpiresAt = now + CACHE_TTL_MS;
		return {};
	}

	const row = await db.siteSetting.findUnique({
		where: { id: EMAIL_SETTINGS_ID },
	});

	if (!row?.ciphertext) {
		cachedSettings = {};
		cacheExpiresAt = now + CACHE_TTL_MS;
		return {};
	}

	const secret = process.env.SETTINGS_ENCRYPTION_KEY?.trim() ?? "";
	const decrypted = decryptSettingsJson(row.ciphertext, secret);
	if (!decrypted) {
		logger.warn("Failed to decrypt stored email settings");
		cachedSettings = {};
		cacheExpiresAt = now + CACHE_TTL_MS;
		return {};
	}

	try {
		const parsed = JSON.parse(decrypted) as StoredEmailSettings;
		cachedSettings = parsed;
		cacheExpiresAt = now + CACHE_TTL_MS;
		return parsed;
	} catch {
		logger.warn("Failed to parse decrypted email settings JSON");
		cachedSettings = {};
		cacheExpiresAt = now + CACHE_TTL_MS;
		return {};
	}
}

const ENV_FALLBACK_PROVIDERS: readonly { name: EmailProviderType; envKey: string }[] = [
	{ name: "zsend", envKey: "ZSEND_API_KEY" },
	{ name: "tosend", envKey: "TOSEND_API_KEY" },
	{ name: "resend", envKey: "RESEND_API_KEY" },
	{ name: "smtp", envKey: "SMTP_HOST" },
] as const;

export async function resolveActiveProvider(
	providedSettings?: StoredEmailSettings,
): Promise<{
	name: EmailProviderType;
	source: "stored" | "environment";
} | null> {
	const settings = providedSettings ?? (await readEmailSettings());
	if (settings.provider && hasStoredCredential(settings, settings.provider)) {
		return { name: settings.provider, source: "stored" };
	}

	const requested = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
	const envHas = (k: string) => Boolean(process.env[k]?.trim());

	if (requested) {
		const match = ENV_FALLBACK_PROVIDERS.find((c) => c.name === requested);
		if (match && envHas(match.envKey)) {
			return { name: match.name, source: "environment" };
		}
	}

	const fallback = ENV_FALLBACK_PROVIDERS.find((c) => envHas(c.envKey));
	if (fallback) {
		return { name: fallback.name, source: "environment" };
	}

	return null;
}

export async function getEmailSettingsSummary(): Promise<EmailSettingsSummary> {
	const settings = await readEmailSettings();
	const activeProvider = await resolveActiveProvider();

	const hasTosendApiKey = Boolean(settings.tosendApiKey?.trim());
	const hasZsendApiKey = Boolean(settings.zsendApiKey?.trim());
	const hasResendApiKey = Boolean(settings.resendApiKey?.trim());
	const hasSmtpPass = Boolean(settings.smtpPass?.trim());

	return {
		provider: settings.provider,
		activeProvider,
		hasTosendApiKey,
		tosendApiKeyHint: hasTosendApiKey ? maskSecret(settings.tosendApiKey) : undefined,
		tosendApiBaseUrl: settings.tosendApiBaseUrl,
		hasZsendApiKey,
		zsendApiKeyHint: hasZsendApiKey ? maskSecret(settings.zsendApiKey) : undefined,
		zsendDomain: settings.zsendDomain,
		hasResendApiKey,
		resendApiKeyHint: hasResendApiKey ? maskSecret(settings.resendApiKey) : undefined,
		smtpHost: settings.smtpHost,
		smtpPort: settings.smtpPort,
		hasSmtpPass,
		smtpPassHint: hasSmtpPass ? maskSecret(settings.smtpPass) : undefined,
		smtpUser: settings.smtpUser,
		smtpSecure: settings.smtpSecure,
		senderName: settings.senderName,
		fromEmail: settings.fromEmail,
		newsletterSenderName: settings.newsletterSenderName,
		newsletterReplyTo: settings.newsletterReplyTo,
		footerCompany: settings.footerCompany,
		footerAddress: settings.footerAddress,
		footerEmail: settings.footerEmail,
		newsletterRatePerMinute: settings.newsletterRatePerMinute,
	};
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const VALID_PROVIDERS: readonly EmailProviderType[] = [
	"zsend",
	"tosend",
	"resend",
	"smtp",
] as const;

const STRING_KEYS = [
	"zsendApiKey",
	"zsendDomain",
	"tosendApiKey",
	"tosendApiBaseUrl",
	"resendApiKey",
	"smtpHost",
	"smtpUser",
	"smtpPass",
	"senderName",
	"fromEmail",
	"newsletterSenderName",
	"newsletterReplyTo",
	"footerCompany",
	"footerAddress",
	"footerEmail",
] as const;

const ALLOWED_SETTING_KEYS = [
	"provider",
	...STRING_KEYS,
	"smtpPort",
	"smtpSecure",
	"newsletterRatePerMinute",
] as const;

export type SaveEmailSettingsResult =
	| { ok: true }
	| { ok: false; error: "invalid_input" | "settings_unavailable" };

export async function saveEmailSettings(
	input: Partial<StoredEmailSettings>,
	updatedBy?: string | null,
): Promise<SaveEmailSettingsResult> {
	const secret = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
	if (!secret) {
		return { ok: false, error: "settings_unavailable" };
	}

	// 驗證邊界
	if (
		input.provider !== undefined &&
		!VALID_PROVIDERS.includes(input.provider as EmailProviderType)
	) {
		return { ok: false, error: "invalid_input" };
	}
	for (const key of STRING_KEYS) {
		const val = (input as Record<string, unknown>)[key];
		if (val !== undefined && typeof val !== "string") {
			return { ok: false, error: "invalid_input" };
		}
	}
	if (input.smtpSecure !== undefined && typeof input.smtpSecure !== "boolean") {
		return { ok: false, error: "invalid_input" };
	}
	if (input.fromEmail !== undefined && input.fromEmail !== "" && !isValidEmail(input.fromEmail)) {
		return { ok: false, error: "invalid_input" };
	}
	if (
		input.newsletterReplyTo !== undefined &&
		input.newsletterReplyTo !== "" &&
		!isValidEmail(input.newsletterReplyTo)
	) {
		return { ok: false, error: "invalid_input" };
	}
	if (
		input.footerEmail !== undefined &&
		input.footerEmail !== "" &&
		!isValidEmail(input.footerEmail)
	) {
		return { ok: false, error: "invalid_input" };
	}
	if (input.smtpPort !== undefined) {
		if (
			typeof input.smtpPort !== "number" ||
			!Number.isInteger(input.smtpPort) ||
			input.smtpPort < 1 ||
			input.smtpPort > 65535
		) {
			return { ok: false, error: "invalid_input" };
		}
	}
	if (input.newsletterRatePerMinute !== undefined) {
		if (
			typeof input.newsletterRatePerMinute !== "number" ||
			!Number.isInteger(input.newsletterRatePerMinute) ||
			input.newsletterRatePerMinute < 1 ||
			input.newsletterRatePerMinute > 600
		) {
			return { ok: false, error: "invalid_input" };
		}
	}

	const db = await getDb();
	if (!db) {
		return { ok: false, error: "settings_unavailable" };
	}

	// 讀取既有設定（繞過快取取最新）
	let existing: StoredEmailSettings = {};
	const row = await db.siteSetting.findUnique({
		where: { id: EMAIL_SETTINGS_ID },
	});
	if (row?.ciphertext) {
		const decrypted = decryptSettingsJson(row.ciphertext, secret);
		if (decrypted) {
			try {
				existing = JSON.parse(decrypted);
			} catch {
				// ignore
			}
		}
	}

	const next: StoredEmailSettings = {};
	for (const key of ALLOWED_SETTING_KEYS) {
		const existingVal = (existing as Record<string, unknown>)[key];
		if (existingVal !== undefined) {
			(next as Record<string, unknown>)[key] = existingVal;
		}
	}

	for (const key of ALLOWED_SETTING_KEYS) {
		const value = (input as Record<string, unknown>)[key];
		if (value === undefined) continue;
		if (CREDENTIAL_KEYS.includes(key as (typeof CREDENTIAL_KEYS)[number]) && value === "") {
			// 空字串金鑰沿用既有值
			continue;
		}
		(next as Record<string, unknown>)[key] = value;
	}

	const ciphertext = encryptSettingsJson(JSON.stringify(next), secret);
	await db.siteSetting.upsert({
		where: { id: EMAIL_SETTINGS_ID },
		create: {
			id: EMAIL_SETTINGS_ID,
			ciphertext,
			updatedBy: updatedBy ?? null,
		},
		update: {
			ciphertext,
			updatedBy: updatedBy ?? null,
		},
	});

	clearEmailSettingsCache();
	return { ok: true };
}

export type SendTestEmailResult =
	| { ok: true; provider: string }
	| { ok: false; error: string };

export function hasStoredCredential(settings: StoredEmailSettings, provider: string): boolean {
	switch (provider) {
		case "tosend":
			return Boolean(settings.tosendApiKey?.trim());
		case "zsend":
			return Boolean(settings.zsendApiKey?.trim());
		case "resend":
			return Boolean(settings.resendApiKey?.trim());
		case "smtp":
			return Boolean(settings.smtpHost?.trim());
		default:
			return false;
	}
}

export function getStoredProviderSender(settings: StoredEmailSettings): SendEmailHandler | null {
	switch (settings.provider) {
		case "tosend":
			return createToSendSender({
				apiKey: settings.tosendApiKey,
				apiBaseUrl: settings.tosendApiBaseUrl,
				fromEmail: settings.fromEmail,
			});
		case "zsend":
			return createZSendSender({
				apiKey: settings.zsendApiKey,
				domain: settings.zsendDomain,
			});
		case "resend":
			return createResendSender({
				apiKey: settings.resendApiKey,
			});
		case "smtp":
			return createSmtpSender({
				host: settings.smtpHost,
				port: settings.smtpPort,
				user: settings.smtpUser,
				pass: settings.smtpPass,
				secure: settings.smtpSecure,
			});
		default:
			return null;
	}
}

export async function sendTestEmail(to: string): Promise<SendTestEmailResult> {
	if (!to || !isValidEmail(to)) {
		return { ok: false, error: "invalid_recipient" };
	}

	const settings = await readEmailSettings();
	if (!settings.provider || !hasStoredCredential(settings, settings.provider)) {
		return { ok: false, error: "no_provider_configured" };
	}

	const sender = getStoredProviderSender(settings);
	if (!sender) {
		return { ok: false, error: "no_provider_configured" };
	}

	const from = settings.fromEmail
		? settings.senderName
			? `"${settings.senderName}" <${settings.fromEmail}>`
			: settings.fromEmail
		: undefined;

	try {
		await sender({
			to,
			from,
			subject: "StartKiter 測試信件",
			text: "這是一封來自 StartKiter 的測試信件，代表您的寄信設定已生效。",
			html: "<p>這是一封來自 StartKiter 的測試信件，代表您的寄信設定已生效。</p>",
		});

		return { ok: true, provider: settings.provider };
	} catch (err: unknown) {
		const rawMessage = err instanceof Error ? err.message : String(err);
		let sanitized = rawMessage;
		const sensitiveValues = [
			settings.tosendApiKey,
			settings.zsendApiKey,
			settings.resendApiKey,
			settings.smtpPass,
		].filter((v): v is string => Boolean(v && v.trim()));

		for (const secretVal of sensitiveValues) {
			sanitized = sanitized.split(secretVal).join("***");
		}

		return { ok: false, error: sanitized };
	}
}

