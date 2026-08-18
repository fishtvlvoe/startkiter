import { describe, expect, it } from "vitest";

import { acceptCredentialHandoff, type CredentialSink } from "./credentials";
import type { ThirdPartyCredentialHandoff } from "./types";

function fakeSink() {
	const envWrites: { envKey: string; value: string }[] = [];
	const logs: string[] = [];
	const sink: CredentialSink = {
		writeEnv: (envKey, value) => envWrites.push({ envKey, value }),
		log: (message) => logs.push(message),
	};
	return { sink, envWrites, logs };
}

describe("acceptCredentialHandoff", () => {
	it("rejects a targetEnvKey outside the allowlist and writes nothing", () => {
		const { sink, envWrites } = fakeSink();
		const handoff: ThirdPartyCredentialHandoff = {
			kind: "payment",
			targetEnvKey: "SOME_RANDOM_ENV_KEY",
			value: "sk_live_super_secret",
		};

		const result = acceptCredentialHandoff(handoff, sink);

		expect(result).toEqual({ ok: false, reason: "env_key_not_allowlisted" });
		expect(envWrites).toHaveLength(0);
	});

	it("writes the value for an allowlisted key", () => {
		const { sink, envWrites } = fakeSink();
		const handoff: ThirdPartyCredentialHandoff = {
			kind: "payment",
			targetEnvKey: "PAYMENT_PROVIDER_API_KEY",
			value: "sk_live_super_secret",
		};

		const result = acceptCredentialHandoff(handoff, sink);

		expect(result).toEqual({ ok: true });
		expect(envWrites).toEqual([{ envKey: "PAYMENT_PROVIDER_API_KEY", value: "sk_live_super_secret" }]);
	});

	it("never passes the credential value to the logger", () => {
		const { sink, logs } = fakeSink();
		const handoff: ThirdPartyCredentialHandoff = {
			kind: "domain-dns",
			targetEnvKey: "CLOUDFLARE_DNS_TOKEN",
			value: "cf_scoped_token_abc123",
		};

		acceptCredentialHandoff(handoff, sink);

		for (const message of logs) {
			expect(message).not.toContain("cf_scoped_token_abc123");
		}
	});
});
