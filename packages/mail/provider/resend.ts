import { Resend } from "resend";

import { config } from "../config";
import { rejectWhenAborted } from "../lib/abort";
import type { SendEmailHandler } from "../types";

let resendClient: Resend | null | undefined;

function getResendClient(): Resend {
	if (resendClient === undefined) {
		resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
	}

	if (!resendClient) {
		throw new Error("RESEND_API_KEY is required to send email with the Resend provider");
	}

	return resendClient;
}

/** 測試用：清掉模組級 client 快取，讓下一輪依當下 env 重建。 */
export function resetResendClientForTests(): void {
	resendClient = undefined;
}

export const send: SendEmailHandler = async ({
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
	const resend = getResendClient();

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
