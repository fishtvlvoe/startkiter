import type { ThirdPartyCredentialHandoff } from "./types";

export const CREDENTIAL_ENV_KEY_ALLOWLIST = [
	"EMAIL_PROVIDER_API_KEY",
	"PAYMENT_PROVIDER_API_KEY",
	"CLOUDFLARE_DNS_TOKEN",
] as const;

export type CredentialHandoffResult = { ok: true } | { ok: false; reason: "env_key_not_allowlisted" };

export type CredentialSink = {
	writeEnv: (envKey: string, value: string) => void;
	log: (message: string) => void;
};

export function acceptCredentialHandoff(
	handoff: ThirdPartyCredentialHandoff,
	sink: CredentialSink,
): CredentialHandoffResult {
	if (!(CREDENTIAL_ENV_KEY_ALLOWLIST as readonly string[]).includes(handoff.targetEnvKey)) {
		return { ok: false, reason: "env_key_not_allowlisted" };
	}
	sink.writeEnv(handoff.targetEnvKey, handoff.value);
	sink.log(`Credential accepted for env key ${handoff.targetEnvKey} (kind: ${handoff.kind})`);
	return { ok: true };
}
