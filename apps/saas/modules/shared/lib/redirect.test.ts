import { describe, expect, it } from "vitest";

import { buildLoginRedirectUrl, getLoginReturnPath, getSafeRedirectPath } from "./redirect";

describe("getSafeRedirectPath", () => {
	it.each([
		["/", "/"],
		["/dashboard", "/dashboard"],
		["/settings/billing?interval=year#plans", "/settings/billing?interval=year#plans"],
		["/organizations/../settings", "/settings"],
	])("allows the internal path %s", (path, expected) => {
		expect(getSafeRedirectPath(path, "/fallback")).toBe(expected);
	});

	it.each([
		"https://attacker.example",
		"https://saas.invalid/settings",
		"//attacker.example",
		"///attacker.example",
		"/\\attacker.example",
		"javascript:alert(1)",
		"data:text/html,malicious",
		"dashboard",
		"/%2e%2e//attacker.example",
	])("rejects the unsafe redirect %s", (path) => {
		expect(getSafeRedirectPath(path, "/fallback")).toBe("/fallback");
	});

	it("uses the fallback when no redirect is provided", () => {
		expect(getSafeRedirectPath(null, "/fallback")).toBe("/fallback");
	});

	it("falls back to the app root when the fallback is also unsafe", () => {
		expect(getSafeRedirectPath("https://attacker.example", "//attacker.example")).toBe("/");
	});
});

describe("getLoginReturnPath", () => {
	it("prefers next over redirectTo", () => {
		const params = new URLSearchParams("next=/bundles/combo-a&redirectTo=/invite/x");
		expect(getLoginReturnPath(params, "/app")).toBe("/bundles/combo-a");
	});

	it("falls back to redirectTo when next is absent", () => {
		const params = new URLSearchParams("redirectTo=/invite/token");
		expect(getLoginReturnPath(params, "/app")).toBe("/invite/token");
	});

	it("uses the default when neither param is present", () => {
		expect(getLoginReturnPath(new URLSearchParams(), "/app")).toBe("/app");
	});
});

describe("buildLoginRedirectUrl", () => {
	it("attaches a safe next path", () => {
		expect(buildLoginRedirectUrl("/bundles/combo-a")).toBe(
			"/login?next=%2Fbundles%2Fcombo-a",
		);
	});

	it("omits next for missing or unsafe paths", () => {
		expect(buildLoginRedirectUrl(null)).toBe("/login");
		expect(buildLoginRedirectUrl("https://attacker.example")).toBe("/login");
	});
});
