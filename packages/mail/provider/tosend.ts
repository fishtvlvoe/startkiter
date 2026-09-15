import { config } from "../config";
import type { SendEmailHandler } from "../types";

const DEFAULT_TOSEND_API_BASE_URL = "https://api.tosend.com/v2";

/** 解析 `"Name <email>"`；沒有尖括號時整段當 email。 */
export function parseEmailAddress(value: string): { name?: string; email: string } {
	const normalized = value.trim();
	const match = normalized.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
	if (!match) {
		return { email: normalized };
	}

	const name = match[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
	return {
		...(name ? { name } : {}),
		email: match[2]?.trim() ?? "",
	};
}

export const send: SendEmailHandler = async ({
	to,
	from,
	subject,
	text,
	html,
}) => {
	const apiKey = process.env.TOSEND_API_KEY;
	const baseUrl = (process.env.TOSEND_API_BASE_URL || DEFAULT_TOSEND_API_BASE_URL).replace(
		/\/+$/,
		"",
	);
	const endpoint = `${baseUrl}/emails`;

	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			from: parseEmailAddress(from ?? config.mailFrom ?? ""),
			to: [parseEmailAddress(to)],
			subject,
			html,
			text,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => response.statusText);
		throw new Error(`ToSend API error (${response.status}): ${errorText}`);
	}

	// 成敗只看 HTTP 狀態；message id 欄位缺失仍視為成功
	await response.json().catch(() => ({}));
};
