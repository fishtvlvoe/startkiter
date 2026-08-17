import { createSign } from "node:crypto";

import type { GithubCollaboratorClient, GithubKitConfig } from "./types";

function toBase64Url(input: string | Buffer): string {
	return Buffer.from(input)
		.toString("base64")
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");
}

export function createGithubAppJwt(appId: string, privateKeyPem: string, nowSec = Math.floor(Date.now() / 1000)): string {
	const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
	const payload = toBase64Url(
		JSON.stringify({
			iat: nowSec - 60,
			exp: nowSec + 9 * 60,
			iss: appId,
		}),
	);
	const data = `${header}.${payload}`;
	const signer = createSign("RSA-SHA256");
	signer.update(data);
	const signature = signer.sign(privateKeyPem).toString("base64url");
	return `${data}.${signature}`;
}

export async function fetchInstallationToken(config: GithubKitConfig): Promise<string> {
	const jwt = createGithubAppJwt(config.appId, config.privateKeyPem);
	const res = await fetch(
		`https://api.github.com/app/installations/${config.installationId}/access_tokens`,
		{
			method: "POST",
			headers: {
				Accept: "application/vnd.github+json",
				Authorization: `Bearer ${jwt}`,
				"X-GitHub-Api-Version": "2022-11-28",
				"User-Agent": "startkiter-github-kit",
			},
		},
	);
	if (!res.ok) {
		throw new Error(`github_installation_token_failed:${res.status}`);
	}
	const body = (await res.json()) as { token?: string };
	if (!body.token) {
		throw new Error("github_installation_token_missing");
	}
	return body.token;
}

export function createGithubAppCollaboratorClient(
	config: GithubKitConfig,
	fetchImpl: typeof fetch = fetch,
): GithubCollaboratorClient {
	async function withToken<T>(fn: (token: string) => Promise<T>): Promise<T> {
		const token = await fetchInstallationToken(config);
		return fn(token);
	}

	return {
		async invitePullCollaborator({ org, repo, username }) {
			await withToken(async (token) => {
				const res = await fetchImpl(
					`https://api.github.com/repos/${org}/${repo}/collaborators/${encodeURIComponent(username)}`,
					{
						method: "PUT",
						headers: {
							Accept: "application/vnd.github+json",
							Authorization: `Bearer ${token}`,
							"X-GitHub-Api-Version": "2022-11-28",
							"User-Agent": "startkiter-github-kit",
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ permission: "pull" }),
					},
				);
				if (!res.ok && res.status !== 204) {
					throw new Error(`github_invite_failed:${res.status}`);
				}
			});
		},
		async removeCollaborator({ org, repo, username }) {
			await withToken(async (token) => {
				const res = await fetchImpl(
					`https://api.github.com/repos/${org}/${repo}/collaborators/${encodeURIComponent(username)}`,
					{
						method: "DELETE",
						headers: {
							Accept: "application/vnd.github+json",
							Authorization: `Bearer ${token}`,
							"X-GitHub-Api-Version": "2022-11-28",
							"User-Agent": "startkiter-github-kit",
						},
					},
				);
				if (!res.ok && res.status !== 204 && res.status !== 404) {
					throw new Error(`github_revoke_failed:${res.status}`);
				}
			});
		},
	};
}
