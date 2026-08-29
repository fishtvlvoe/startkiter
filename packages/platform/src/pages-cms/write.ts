import { sanitizePageBody } from "./sanitize";

export function prepareSanitizedPageWrite<T extends { body: string }>(input: T): {
	data: T;
	warnings: string[];
} {
	const sanitized = sanitizePageBody(input.body);
	return {
		data: { ...input, body: sanitized.html },
		warnings: sanitized.warnings,
	};
}
