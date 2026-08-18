export type FleetTokenCheckResult = { ok: true; token: string } | { ok: false; reason: "token_missing" };

export function requireCoolifyApiToken(env: Record<string, string | undefined>): FleetTokenCheckResult {
	const token = env.COOLIFY_API_TOKEN;
	if (!token) {
		return { ok: false, reason: "token_missing" };
	}
	return { ok: true, token };
}

export type SshCredentialValidationResult =
	| { ok: true }
	| { ok: false; reason: "malformed_ssh_credential"; message: string };

const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const SSH_PUBLIC_KEY_PREFIX = /^ssh-(ed25519|rsa|dss|ecdsa)\s/;

export function validateSshHandoff(input: { ip: string; publicKey: string }): SshCredentialValidationResult {
	if (!IPV4_PATTERN.test(input.ip) || input.ip.split(".").some((part) => Number(part) > 255)) {
		return { ok: false, reason: "malformed_ssh_credential", message: "IP address is not a valid IPv4 address" };
	}
	if (!SSH_PUBLIC_KEY_PREFIX.test(input.publicKey)) {
		return {
			ok: false,
			reason: "malformed_ssh_credential",
			message: "Public key must start with a recognized ssh key type (e.g. ssh-ed25519)",
		};
	}
	return { ok: true };
}
