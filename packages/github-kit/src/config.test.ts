import { describe, expect, it } from "vitest";

import { isGithubOAuthConfigured, normalizePrivateKeyPem, resolveGithubKitConfig } from "./config";

describe("normalizePrivateKeyPem", () => {
	it("rejects non-PEM strings and invalid PEM markers", () => {
		expect(normalizePrivateKeyPem("not-a-key")).toBeNull();
		expect(normalizePrivateKeyPem("")).toBeNull();
		expect(
			normalizePrivateKeyPem("-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----"),
		).toBeNull();
	});

	it("accepts a real RSA private key PEM", async () => {
		const { generateKeyPairSync } = await import("node:crypto");
		const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
		const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
		expect(normalizePrivateKeyPem(pem)).toContain("BEGIN");
	});
});

describe("resolveGithubKitConfig", () => {
	it("fail-closed when org or repo missing", () => {
		expect(
			resolveGithubKitConfig({
				GITHUB_APP_ID: "1",
				GITHUB_APP_INSTALLATION_ID: "2",
				GITHUB_APP_PRIVATE_KEY:
					"-----BEGIN PRIVATE KEY-----\nX\n-----END PRIVATE KEY-----",
				GITHUB_KIT_ORG: "startkiter",
			}),
		).toBeNull();
	});
});

describe("isGithubOAuthConfigured", () => {
	it("requires both client id and secret", () => {
		expect(isGithubOAuthConfigured({ GITHUB_CLIENT_ID: "a" })).toBe(false);
		expect(
			isGithubOAuthConfigured({
				GITHUB_CLIENT_ID: "a",
				GITHUB_CLIENT_SECRET: "b",
			}),
		).toBe(true);
	});
});
