import { logger } from "@startkiter/logs";

import { readEmailSettings, type StoredEmailSettings } from "../lib/email-settings";
import type { SendEmailHandler } from "../types";
import { send as consoleSend } from "./console";
import { createSmtpSender, send as nodemailerSend } from "./nodemailer";
import { createResendSender, send as resendSend } from "./resend";
import { createToSendSender, send as tosendSend } from "./tosend";
import { createZSendSender, send as zsendSend } from "./zsend";

type ProviderName = "resend" | "smtp" | "zsend" | "tosend" | "console";

type ProviderDefinition = {
	name: ProviderName;
	envKey: string;
	send: SendEmailHandler;
};

const fallbackProviders: ProviderDefinition[] = [
	{ name: "zsend", envKey: "ZSEND_API_KEY", send: zsendSend },
	{ name: "tosend", envKey: "TOSEND_API_KEY", send: tosendSend },
	{ name: "resend", envKey: "RESEND_API_KEY", send: resendSend },
	// 允許無帳密的開放 relay；缺 SMTP_USER/PASS 會在 nodemailer 送信時才報錯。
	{ name: "smtp", envKey: "SMTP_HOST", send: nodemailerSend },
];

function getRequestedProvider(): ProviderName | undefined {
	const requestedProvider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
	return fallbackProviders.find(({ name }) => name === requestedProvider)?.name;
}

function hasCredential(envKey: string): boolean {
	return Boolean(process.env[envKey]?.trim());
}

function getEnvEmailProvider(): ProviderDefinition {
	const requestedProvider = getRequestedProvider();
	const explicitlyRequested = requestedProvider
		? fallbackProviders.find(({ name }) => name === requestedProvider)
		: undefined;

	if (explicitlyRequested && hasCredential(explicitlyRequested.envKey)) {
		return explicitlyRequested;
	}

	const selectedProvider = fallbackProviders.find(({ envKey }) => hasCredential(envKey));
	if (selectedProvider) {
		if (explicitlyRequested && selectedProvider.name !== explicitlyRequested.name) {
			logger.warn(
				`Email provider "${explicitlyRequested.name}" is unavailable; falling back to "${selectedProvider.name}"`,
			);
		}

		return selectedProvider;
	}

	if (process.env.NODE_ENV !== "production") {
		return {
			name: "console",
			envKey: "",
			send: consoleSend,
		};
	}

	throw new Error(
		"No email provider is configured (checked EMAIL_PROVIDER, TOSEND_API_KEY, ZSEND_API_KEY, RESEND_API_KEY, SMTP_HOST)",
	);
}

function hasStoredCredential(settings: StoredEmailSettings, provider: string): boolean {
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

function getStoredProviderSender(settings: StoredEmailSettings): SendEmailHandler | null {
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

export const send: SendEmailHandler = async (params) => {
	let stored: StoredEmailSettings = {};
	try {
		stored = await readEmailSettings();
	} catch {
		stored = {};
	}

	if (stored.provider) {
		if (hasStoredCredential(stored, stored.provider)) {
			const sender = getStoredProviderSender(stored);
			if (sender) {
				return sender(params);
			}
		} else {
			logger.warn(
				`Stored email provider "${stored.provider}" lacks required credentials; falling back to environment`,
			);
		}
	}

	const envProvider = getEnvEmailProvider();
	return envProvider.send(params);
};
