import { describe, expect, it } from "vitest";

import { requireCoolifyApiToken, validateSshHandoff } from "./fleet";

describe("requireCoolifyApiToken", () => {
	it("returns token_missing when COOLIFY_API_TOKEN is not set", () => {
		const result = requireCoolifyApiToken({});
		expect(result).toEqual({ ok: false, reason: "token_missing" });
	});

	it("returns the token when present", () => {
		const result = requireCoolifyApiToken({ COOLIFY_API_TOKEN: "secret-token" });
		expect(result).toEqual({ ok: true, token: "secret-token" });
	});
});

describe("validateSshHandoff", () => {
	it("rejects a malformed IP address", () => {
		const result = validateSshHandoff({ ip: "not-an-ip", publicKey: "ssh-ed25519 AAAA..." });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("malformed_ssh_credential");
			expect(result.message.length).toBeGreaterThan(0);
		}
	});

	it("rejects a public key missing the ssh- prefix", () => {
		const result = validateSshHandoff({ ip: "45.76.187.247", publicKey: "not-a-key" });
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.reason).toBe("malformed_ssh_credential");
		}
	});

	it("accepts a well-formed IP and public key", () => {
		const result = validateSshHandoff({ ip: "45.76.187.247", publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5"});
		expect(result).toEqual({ ok: true });
	});
});
