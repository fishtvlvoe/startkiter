import { config } from "../config";
import type { SendEmailHandler } from "../types";

const DEFAULT_TOSEND_API_BASE_URL = "https://api.tosend.com/v2";

function parseEmailAddress(value: string): { name?: string; email: string } {
	const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
	if (!match) {
		return { email: value.trim() };
	}

	const name = match[1].trim().replace(/^["']|["']$/g, "");
	return {
		...(name ? { name } : {}),
		email: match[2].trim(),
	};
}

export const send: SendEmailHandler = async ({
	to,
	from,
	cc,
	bcc,
	replyTo,
	subject,
	text,
	html,
}) => {
	const apiBaseUrl =
		process.env.TOSEND_API_BASE_URL?.trim().replace(/\/+$/, "") || DEFAULT_TOSEND_API_BASE_URL;
	const sender = from ?? (process.env.TOSEND_FROM_EMAIL?.trim() || config.mailFrom);
	const response = await fetch(`${apiBaseUrl}/emails`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.TOSEND_API_KEY ?? ""}`,
		},
		body: JSON.stringify({
			from: parseEmailAddress(sender),
			to: [parseEmailAddress(to)],
			cc: cc?.map(parseEmailAddress),
			bcc: bcc?.map(parseEmailAddress),
			replyTo,
			subject,
			text,
			html,
		}),
	});

	if (!response.ok) {
		const body = await response.text().catch(() => response.statusText);
		throw new Error(`ToSend API error (${response.status}): ${body}`);
	}
};
