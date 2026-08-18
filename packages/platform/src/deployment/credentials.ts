import type { ThirdPartyCredentialHandoff, ThirdPartyCredentialKind } from "./types";

/**
 * Each credential kind may only target its own env key — this is a map, not
 * an independent allowlist, so a "payment" credential can never land in
 * CLOUDFLARE_DNS_TOKEN even if the caller supplies a technically-allowlisted
 * key for a different kind.
 */
const KIND_TO_ENV_KEY = Object.freeze({
	email: "EMAIL_PROVIDER_API_KEY",
	payment: "PAYMENT_PROVIDER_API_KEY",
	"domain-dns": "CLOUDFLARE_DNS_TOKEN",
}) satisfies Record<ThirdPartyCredentialKind, string>;

export const CREDENTIAL_ENV_KEY_ALLOWLIST = Object.freeze(Object.values(KIND_TO_ENV_KEY)) as readonly string[];

const KNOWN_KINDS: readonly string[] = Object.freeze(Object.keys(KIND_TO_ENV_KEY));

export type CredentialHandoffResult =
	| { ok: true }
	| { ok: false; reason: "unknown_kind" | "env_key_not_allowlisted" | "kind_env_key_mismatch" };

export type CredentialSink = {
	writeEnv: (envKey: string, value: string) => void;
	log: (message: string) => void;
};

export function acceptCredentialHandoff(
	handoff: ThirdPartyCredentialHandoff,
	sink: CredentialSink,
): CredentialHandoffResult {
	// Validated at runtime, not just trusted from the TypeScript type — this
	// function may be called from contexts (tests, future callers) that skip
	// the oRPC input schema, so it cannot assume `handoff.kind` is one of the
	// known literals just because the type says so.
	if (!KNOWN_KINDS.includes(handoff.kind)) {
		return { ok: false, reason: "unknown_kind" };
	}
	if (!CREDENTIAL_ENV_KEY_ALLOWLIST.includes(handoff.targetEnvKey)) {
		return { ok: false, reason: "env_key_not_allowlisted" };
	}
	if (KIND_TO_ENV_KEY[handoff.kind] !== handoff.targetEnvKey) {
		return { ok: false, reason: "kind_env_key_mismatch" };
	}

	sink.writeEnv(handoff.targetEnvKey, handoff.value);
	// Only the already-allowlisted env key name is logged, never `kind` or
	// `value` — `kind` is excluded even though it is now runtime-validated,
	// so a future edit to this function cannot reintroduce a value leak by
	// interpolating an untrusted field back into the log line.
	sink.log(`Credential accepted for env key ${handoff.targetEnvKey}`);
	return { ok: true };
}
