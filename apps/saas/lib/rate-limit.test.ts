import { describe, expect, it } from "vitest";

import { checkRateLimit, resolveTrustedClientIp } from "./rate-limit";

describe("checkRateLimit (Requirement: Rate limit protects against brute-force enumeration)", () => {
	it("allows requests under the limit", () => {
		const key = `test-${Date.now()}-a`;
		for (let i = 0; i < 5; i++) {
			expect(checkRateLimit(key, { limit: 5, windowMs: 60_000 })).toBe(true);
		}
	});

	it("rejects the request once the same identifier exceeds the limit within the window", () => {
		const key = `test-${Date.now()}-b`;
		for (let i = 0; i < 5; i++) {
			checkRateLimit(key, { limit: 5, windowMs: 60_000 });
		}
		expect(checkRateLimit(key, { limit: 5, windowMs: 60_000 })).toBe(false);
	});

	it("resets the count for a different identifier", () => {
		const keyA = `test-${Date.now()}-c1`;
		const keyB = `test-${Date.now()}-c2`;
		for (let i = 0; i < 5; i++) {
			checkRateLimit(keyA, { limit: 5, windowMs: 60_000 });
		}
		expect(checkRateLimit(keyB, { limit: 5, windowMs: 60_000 })).toBe(true);
	});
});

describe("resolveTrustedClientIp", () => {
	it("uses the right-most x-forwarded-for hop (proxy-appended)", () => {
		expect(resolveTrustedClientIp("198.51.100.1, 203.0.113.50")).toBe("203.0.113.50");
	});

	it("returns unknown when the header is missing", () => {
		expect(resolveTrustedClientIp(null)).toBe("unknown");
		expect(resolveTrustedClientIp("")).toBe("unknown");
	});
});
