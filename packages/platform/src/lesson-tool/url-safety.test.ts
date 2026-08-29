import { describe, expect, it } from "vitest";

import { checkLessonToolUrl, isPrivateOrLocalUrl } from "./url-safety";

const publicLookup = async () => ["93.184.216.34"];
const privateIpv4Lookup = async () => ["10.0.0.1"];
const metadataLookup = async () => ["169.254.169.254"];
const mixedLookup = async () => ["93.184.216.34", "10.1.2.3"];
const ipv6UlaLookup = async () => ["fc00::1"];
const emptyLookup = async () => [];

describe("isPrivateOrLocalUrl (Requirement: Tool URL must not resolve to a private or local address)", () => {
	it.each([
		["http://localhost/tool", true],
		["http://127.0.0.1/tool", true],
		["http://10.1.2.3/tool", true],
		["http://192.168.1.1/tool", true],
		["http://169.254.169.254/latest/meta-data", true],
	] as const)("classifies %s as private/local=%s", async (url, expected) => {
		await expect(isPrivateOrLocalUrl(url)).resolves.toBe(expected);
	});

	it("allows a public hostname whose DNS records are all public addresses", async () => {
		await expect(isPrivateOrLocalUrl("https://tools.example.com/whiteboard", publicLookup)).resolves.toBe(
			false,
		);
	});

	it("rejects a public hostname that currently resolves to a private IPv4 address", async () => {
		await expect(isPrivateOrLocalUrl("https://tools.example.com/whiteboard", privateIpv4Lookup)).resolves.toBe(
			true,
		);
		await expect(isPrivateOrLocalUrl("https://tools.example.com/whiteboard", metadataLookup)).resolves.toBe(
			true,
		);
	});

	it("rejects a hostname if any resolved address is private", async () => {
		await expect(isPrivateOrLocalUrl("https://tools.example.com/whiteboard", mixedLookup)).resolves.toBe(true);
	});

	it("rejects IPv6 ULA, link-local, and IPv4-mapped loopback literals", async () => {
		await expect(isPrivateOrLocalUrl("http://[fc00::1]/")).resolves.toBe(true);
		await expect(isPrivateOrLocalUrl("http://[fe80::1]/")).resolves.toBe(true);
		await expect(isPrivateOrLocalUrl("http://[::ffff:127.0.0.1]/")).resolves.toBe(true);
	});

	it("rejects a hostname that resolves to IPv6 ULA", async () => {
		await expect(isPrivateOrLocalUrl("https://tools.example.com/whiteboard", ipv6UlaLookup)).resolves.toBe(
			true,
		);
	});

	it("fails closed when DNS returns no addresses", async () => {
		await expect(isPrivateOrLocalUrl("https://tools.example.com/whiteboard", emptyLookup)).resolves.toBe(true);
	});
});

describe("checkLessonToolUrl (Requirement: only http/https tool URLs are allowed)", () => {
	it("rejects data, javascript, and file schemes", async () => {
		await expect(checkLessonToolUrl("data:text/html,hello")).resolves.toEqual({
			ok: false,
			code: "TOOL_URL_INVALID",
		});
		await expect(checkLessonToolUrl("javascript:alert(1)")).resolves.toEqual({
			ok: false,
			code: "TOOL_URL_INVALID",
		});
		await expect(checkLessonToolUrl("file:///etc/passwd")).resolves.toEqual({
			ok: false,
			code: "TOOL_URL_INVALID",
		});
	});

	it("accepts an https URL whose DNS records are public", async () => {
		await expect(checkLessonToolUrl("https://tools.example.com/whiteboard", publicLookup)).resolves.toEqual({
			ok: true,
		});
	});
});
