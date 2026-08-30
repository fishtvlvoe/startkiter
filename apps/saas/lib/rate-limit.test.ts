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
	it("with TRUSTED_PROXY_COUNT=1 (default Coolify+Traefik), uses the right-most hop", () => {
		expect(resolveTrustedClientIp("198.51.100.1, 203.0.113.50", 1)).toBe("203.0.113.50");
	});

	it("with TRUSTED_PROXY_COUNT=1, ignores arbitrary forged prefixes when the proxy appends one hop", () => {
		// 客戶端在左側塞再多偽造段都無效；只認從右往左第 1 段（代理 append）
		expect(
			resolveTrustedClientIp(
				"198.51.100.1, 198.51.100.2, 198.51.100.3, 198.51.100.4, 203.0.113.50",
				1,
			),
		).toBe("203.0.113.50");
	});

	it("with TRUSTED_PROXY_COUNT=2, picks the hop that many steps from the right (not always last)", () => {
		// CDN → Traefik → app：倒數第 2 段才是真實 client，最後一段是內層代理連線 IP
		expect(resolveTrustedClientIp("198.51.100.1, 203.0.113.50, 192.0.2.10", 2)).toBe(
			"203.0.113.50",
		);
	});

	it("reads TRUSTED_PROXY_COUNT from the environment when hop count is omitted", () => {
		const previous = process.env.TRUSTED_PROXY_COUNT;
		process.env.TRUSTED_PROXY_COUNT = "2";
		try {
			expect(resolveTrustedClientIp("198.51.100.1, 203.0.113.50, 192.0.2.10")).toBe(
				"203.0.113.50",
			);
		} finally {
			if (previous === undefined) {
				delete process.env.TRUSTED_PROXY_COUNT;
			} else {
				process.env.TRUSTED_PROXY_COUNT = previous;
			}
		}
	});

	it("returns unknown when the header is missing or trusted proxy count is zero", () => {
		expect(resolveTrustedClientIp(null)).toBe("unknown");
		expect(resolveTrustedClientIp("")).toBe("unknown");
		expect(resolveTrustedClientIp("203.0.113.50", 0)).toBe("unknown");
	});
});
