import { describe, expect, it } from "vitest";

import { prepareSanitizedPageWrite } from "./write";

describe("prepareSanitizedPageWrite", () => {
	it("strips script, onerror, and javascript: before the write payload is returned", () => {
		const result = prepareSanitizedPageWrite({
			title: "unsafe",
			body: `<p>ok</p><script>alert(1)</script><img src="https://example.com/x.png" onerror=alert(1)><a href="javascript:alert(1)">x</a>`,
		});

		expect(result.data.body).not.toMatch(/<script/i);
		expect(result.data.body).not.toMatch(/onerror/i);
		expect(result.data.body).not.toMatch(/javascript:/i);
		expect(result.data.title).toBe("unsafe");
		expect(result.warnings.length).toBeGreaterThan(0);
	});
});
