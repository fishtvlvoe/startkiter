import { logger } from "@startkiter/logs";

import {
	getStoredProviderSender,
	hasStoredCredential,
	readEmailSettings,
	type StoredEmailSettings,
} from "../lib/email-settings";
import type { SendEmailHandler } from "../types";
import { send as consoleSend } from "./console";
import { send as nodemailerSend } from "./nodemailer";
import { send as resendSend } from "./resend";
import { send as tosendSend } from "./tosend";
import { send as zsendSend } from "./zsend";

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

function resolveDefaultFrom(stored: StoredEmailSettings): string | undefined {
	if (stored.fromEmail) {
		return stored.senderName
			? `"${stored.senderName}" <${stored.fromEmail}>`
			: stored.fromEmail;
	}
	return process.env.MAIL_FROM?.trim() || undefined;
}

export const send: SendEmailHandler = async (params) => {
	let stored: StoredEmailSettings = {};
	try {
		stored = await readEmailSettings();
	} catch {
		stored = {};
	}

	const defaultFrom = resolveDefaultFrom(stored);
	const resolvedParams =
		params.from !== undefined
			? params
			: defaultFrom
				? { ...params, from: defaultFrom }
				: params;

	if (stored.provider) {
		if (hasStoredCredential(stored, stored.provider)) {
			const sender = getStoredProviderSender(stored);
			if (sender) {
				return sender(resolvedParams);
			}
		} else {
			logger.warn(
				`Stored email provider "${stored.provider}" lacks required credentials; falling back to environment`,
			);
		}
	}

	const envProvider = getEnvEmailProvider();
	return envProvider.send(resolvedParams);
};
