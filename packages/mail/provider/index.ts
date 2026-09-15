import { logger } from "@startkiter/logs";

import type { SendEmailHandler } from "../types";
import { send as consoleSend } from "./console";
import { send as resendSend } from "./resend";
import { send as smtpSend } from "./nodemailer";
import { send as tosendSend } from "./tosend";
import { send as zsendSend } from "./zsend";

type EmailProviderName = "resend" | "smtp" | "zsend" | "tosend";

const FALLBACK_ORDER: EmailProviderName[] = ["zsend", "tosend", "resend", "smtp"];

const PROVIDERS: Record<EmailProviderName, SendEmailHandler> = {
	zsend: zsendSend,
	tosend: tosendSend,
	resend: resendSend,
	smtp: smtpSend,
};

function isEmailProvider(value: string | undefined): value is EmailProviderName {
	return value === "resend" || value === "smtp" || value === "zsend" || value === "tosend";
}

function hasCredential(provider: EmailProviderName): boolean {
	switch (provider) {
		case "zsend":
			return Boolean(process.env.ZSEND_API_KEY);
		case "tosend":
			return Boolean(process.env.TOSEND_API_KEY);
		case "resend":
			return Boolean(process.env.RESEND_API_KEY);
		case "smtp":
			return Boolean(process.env.SMTP_HOST);
	}
}

function resolveProvider(): EmailProviderName | "console" {
	const requested = process.env.EMAIL_PROVIDER?.trim();
	const named = isEmailProvider(requested) ? requested : undefined;

	if (named && hasCredential(named)) {
		return named;
	}

	for (const candidate of FALLBACK_ORDER) {
		if (hasCredential(candidate)) {
			if (named) {
				logger.warn(
					`Email provider "${named}" is unavailable; falling back to "${candidate}"`,
				);
			}
			return candidate;
		}
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"No email provider is configured (checked EMAIL_PROVIDER, TOSEND_API_KEY, ZSEND_API_KEY, RESEND_API_KEY, SMTP_HOST)",
		);
	}

	if (named) {
		logger.warn(
			`Email provider "${named}" is unavailable; falling back to "console"`,
		);
	}

	return "console";
}

/**
 * 依 EMAIL_PROVIDER 與可用憑證挑選寄信通道。
 * 指定的 provider 缺憑證時，依 zsend → tosend → resend → smtp 找下一個；
 * 正式環境全無憑證 throw，非正式環境 fallback console。
 */
export const send: SendEmailHandler = async (params) => {
	const provider = resolveProvider();

	if (provider === "console") {
		return consoleSend(params);
	}

	return PROVIDERS[provider](params);
};
