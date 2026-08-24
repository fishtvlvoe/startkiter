import { describe, expect, it } from "vitest";

import { sanitizeAssignmentContent } from "./sanitize-html";

describe("assignment HTML sanitizer", () => {
	it("removes scripts, event handlers, and javascript links", () => {
		const sanitized = sanitizeAssignmentContent(
			'<p onclick="alert(1)">安全文字</p><script>alert(2)</script><a href="javascript:alert(3)">連結</a>',
		);

		expect(sanitized).toContain("安全文字");
		expect(sanitized).not.toMatch(/<script|onclick|javascript:/i);
	});
});
