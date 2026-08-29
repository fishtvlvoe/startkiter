import { describe, expect, it } from "vitest";

import { isPrivateOrLocalUrl } from "./url-safety";

describe("isPrivateOrLocalUrl (Requirement: Tool URL must not resolve to a private or local address)", () => {
	it.each([
		["http://localhost/tool", true],
		["http://127.0.0.1/tool", true],
		["http://10.1.2.3/tool", true],
		["http://192.168.1.1/tool", true],
		["http://169.254.169.254/latest/meta-data", true],
		["https://tools.example.com/whiteboard", false],
	] as const)("classifies %s as private/local=%s", (url, expected) => {
		expect(isPrivateOrLocalUrl(url)).toBe(expected);
	});
});
