import { describe, expect, it } from "vitest";

import { resolvePublicBaseUrl } from "./public-base-url";

describe("resolvePublicBaseUrl", () => {
	it("accepts https and strips trailing slash", () => {
		expect(resolvePublicBaseUrl("https://startkiter.aiver.me/")).toBe(
			"https://startkiter.aiver.me",
		);
	});

	it("allows localhost http", () => {
		expect(resolvePublicBaseUrl("http://localhost:3000")).toBe("http://localhost:3000");
	});

	it("rejects non-https public hosts", () => {
		expect(resolvePublicBaseUrl("http://example.com")).toBeNull();
	});

	it("rejects garbage", () => {
		expect(resolvePublicBaseUrl("not-a-url")).toBeNull();
		expect(resolvePublicBaseUrl("")).toBeNull();
	});
});
