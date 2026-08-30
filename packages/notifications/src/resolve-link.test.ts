import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveNotificationLink } from "./resolve-link";

describe("resolveNotificationLink", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("leaves absolute https links unchanged", () => {
		expect(resolveNotificationLink("https://cdn.example.com/n/1")).toBe(
			"https://cdn.example.com/n/1",
		);
	});

	it("leaves absolute http links unchanged", () => {
		expect(resolveNotificationLink("http://localhost:3000/inbox")).toBe(
			"http://localhost:3000/inbox",
		);
	});

	it("resolves relative app paths against the SaaS base URL", () => {
		vi.stubEnv("NEXT_PUBLIC_SAAS_URL", "https://app.startkiter.test");
		expect(resolveNotificationLink("/courses/open-pack")).toBe(
			"https://app.startkiter.test/courses/open-pack",
		);
	});

	it("returns the trimmed input when the URL constructor rejects an unknown shape", () => {
		vi.stubEnv("NEXT_PUBLIC_SAAS_URL", "https://app.startkiter.test");
		expect(resolveNotificationLink("https://[")).toBe("https://[");
	});

	it("returns null for empty or missing links", () => {
		expect(resolveNotificationLink(null)).toBeNull();
		expect(resolveNotificationLink(undefined)).toBeNull();
		expect(resolveNotificationLink("   ")).toBeNull();
	});
});
