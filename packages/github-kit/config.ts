import { createPrivateKey } from "node:crypto";
import { readFileSync } from "node:fs";

import type { GithubKitConfig } from "./types";

/** 正規化 .env 裡可能含 \\n 的 PEM；無效則回 null（fail-closed）。 */
export function normalizePrivateKeyPem(raw: string | undefined): string | null {
	if (!raw?.trim()) {
		return null;
	}
	const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
	if (!pem.includes("BEGIN") || !pem.includes("PRIVATE KEY") || !pem.includes("END")) {
		return null;
	}
	try {
		createPrivateKey(pem.trim());
	} catch {
		return null;
	}
	return pem.trim();
}

function loadPrivateKeyPem(env: Record<string, string | undefined>): string | null {
	const fromEnv = normalizePrivateKeyPem(env.GITHUB_APP_PRIVATE_KEY);
	if (fromEnv) {
		return fromEnv;
	}
	const path = env.GITHUB_APP_PRIVATE_KEY_PATH?.trim();
	if (!path) {
		return null;
	}
	try {
		return normalizePrivateKeyPem(readFileSync(path, "utf8"));
	} catch {
		return null;
	}
}

export function resolveGithubKitConfig(
	env: Record<string, string | undefined>,
): GithubKitConfig | null {
	const appId = env.GITHUB_APP_ID?.trim();
	const installationId = env.GITHUB_APP_INSTALLATION_ID?.trim();
	const org = env.GITHUB_KIT_ORG?.trim();
	const repo = env.GITHUB_KIT_REPO?.trim();
	const templateRepo = env.GITHUB_KIT_TEMPLATE_REPO?.trim();
	const privateKeyPem = loadPrivateKeyPem(env);

	if (!appId || !installationId || !org || !repo || !templateRepo || !privateKeyPem) {
		return null;
	}

	return { appId, installationId, privateKeyPem, org, repo, templateRepo };
}

export function isGithubOAuthConfigured(env: Record<string, string | undefined>): boolean {
	return Boolean(env.GITHUB_CLIENT_ID?.trim() && env.GITHUB_CLIENT_SECRET?.trim());
}
