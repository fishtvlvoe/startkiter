export type FleetTokenCheckResult = { ok: true; token: string } | { ok: false; reason: "token_missing" };

export function requireCoolifyApiToken(env: Record<string, string | undefined>): FleetTokenCheckResult {
	const token = env.COOLIFY_API_TOKEN?.trim();
	if (!token) {
		return { ok: false, reason: "token_missing" };
	}
	return { ok: true, token };
}

export type SshCredentialValidationResult =
	| { ok: true }
	| { ok: false; reason: "malformed_ssh_credential"; message: string };

const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;

// Real OpenSSH key type identifiers. "ssh-ecdsa" (used by the previous,
// looser prefix check) is not one of these — the actual type strings encode
// the curve, e.g. ecdsa-sha2-nistp256.
const SSH_KEY_TYPES = ["ssh-ed25519", "ssh-rsa", "ssh-dss", "ecdsa-sha2-nistp256", "ecdsa-sha2-nistp384", "ecdsa-sha2-nistp521"];
const BASE64_BODY_PATTERN = /^[A-Za-z0-9+/]{20,}={0,2}$/;

export function validateSshHandoff(input: { ip: string; publicKey: string }): SshCredentialValidationResult {
	if (!IPV4_PATTERN.test(input.ip) || input.ip.split(".").some((part) => Number(part) > 255)) {
		return { ok: false, reason: "malformed_ssh_credential", message: "IP address is not a valid IPv4 address" };
	}

	const publicKey = input.publicKey;
	if (publicKey.includes("\n") || publicKey.includes("\r")) {
		return {
			ok: false,
			reason: "malformed_ssh_credential",
			message: "Public key must be a single line, not a private key or multi-key block",
		};
	}

	// An authorized_keys-style key is "<type> <base64-body> [comment]" — split
	// on whitespace and validate the first two fields explicitly rather than
	// only checking that the string starts with a plausible-looking prefix.
	const fields = publicKey.trim().split(/\s+/);
	const [type, body] = fields;
	if (!type || !SSH_KEY_TYPES.includes(type)) {
		return {
			ok: false,
			reason: "malformed_ssh_credential",
			message: "Public key must start with a recognized ssh key type (e.g. ssh-ed25519)",
		};
	}
	if (!body || !BASE64_BODY_PATTERN.test(body)) {
		return {
			ok: false,
			reason: "malformed_ssh_credential",
			message: "Public key body is not valid base64 key material",
		};
	}

	return { ok: true };
}
