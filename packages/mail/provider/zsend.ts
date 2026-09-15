import { config } from "../config";
import type { SendEmailHandler } from "../types";

const ZSEND_API_ENDPOINT = "https://api.zeabur.com/api/v1/zsend/emails";

export const send: SendEmailHandler = async ({
	to,
	from,
	subject,
	text,
	html,
	replyTo,
}) => {
	const apiKey = process.env.ZSEND_API_KEY;

	const response = await fetch(ZSEND_API_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			from: from ?? config.mailFrom,
			to: [to],
			subject,
			html,
			text,
			replyTo,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => response.statusText);
		throw new Error(`Zeabur Email API error (${response.status}): ${errorText}`);
	}

	await response.json().catch(() => ({}));
};
