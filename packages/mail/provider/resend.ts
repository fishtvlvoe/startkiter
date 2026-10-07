import { Resend } from "resend";

import { config } from "../config";
import { rejectWhenAborted } from "../lib/abort";
import type { SendEmailHandler } from "../types";

export type ResendCredentials = {
	apiKey?: string;
};

const clientCache = new Map<string, Resend>();

function getResendClient(apiKey?: string): Resend {
	const key = apiKey ?? process.env.RESEND_API_KEY;
	if (!key) {
		throw new Error("RESEND_API_KEY is required to send email with the Resend provider");
	}

	let client = clientCache.get(key);
	if (!client) {
		client = new Resend(key);
		clientCache.set(key, client);
	}
	return client;
}

/** 測試用：清掉模組級 client 快取，讓下一輪依當下 env 重建。 */
export function resetResendClientForTests(): void {
	clientCache.clear();
}

export function createResendSender(credentials?: ResendCredentials): SendEmailHandler {
	return async ({
		to,
		from,
		subject,
		cc,
		bcc,
		replyTo,
		html,
		text,
		signal,
	}) => {
		const resend = getResendClient(credentials?.apiKey);

		// Resend SDK 無 AbortSignal；以競速確保 timeout 能 reject
		await rejectWhenAborted(
			resend.emails.send({
				from: from ?? config.mailFrom,
				to: [to],
				cc,
				bcc,
				replyTo,
				subject,
				html,
				text,
			}),
			signal,
		);
	};
}

export const send: SendEmailHandler = async (params) => {
	return createResendSender()(params);
};
