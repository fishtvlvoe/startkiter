import { config } from "../config";
import type { SendEmailHandler } from "../types";

const ZSEND_API_ENDPOINT = "https://api.zeabur.com/api/v1/zsend/emails";

export type ZSendCredentials = {
	apiKey?: string;
	domain?: string;
};

export function createZSendSender(credentials?: ZSendCredentials): SendEmailHandler {
	return async ({ to, from, cc, bcc, replyTo, subject, text, html }) => {
		const apiKey = credentials?.apiKey ?? process.env.ZSEND_API_KEY ?? "";
		const response = await fetch(ZSEND_API_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				from: from ?? config.mailFrom,
				to: [to],
				cc,
				bcc,
				replyTo,
				subject,
				text,
				html,
			}),
		});

		if (!response.ok) {
			const body = await response.text().catch(() => response.statusText);
			throw new Error(`ZSend API error (${response.status}): ${body}`);
		}
	};
}

export const createZsendSender = createZSendSender;

export const send: SendEmailHandler = async (params) => {
	return createZSendSender()(params);
};
