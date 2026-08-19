import type { CoolifyStatusProbe } from "./status";

export const COOLIFY_API_BASE = "https://app.coolify.io/api/v1";

export type CoolifyWriteResult<T> =
	| { ok: true; data: T }
	| { ok: false; kind: "network_error" | "api_error" };

async function coolifyRequest(path: string, apiToken: string, init: RequestInit): Promise<CoolifyWriteResult<unknown>> {
	try {
		const response = await fetch(`${COOLIFY_API_BASE}${path}`, {
			...init,
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${apiToken}`,
				"Content-Type": "application/json",
				...(init.headers ?? {}),
			},
		});
		if (!response.ok) {
			return { ok: false, kind: "api_error" };
		}
		const text = await response.text();
		if (!text) {
			return { ok: true, data: {} };
		}
		try {
			return { ok: true, data: JSON.parse(text) as unknown };
		} catch {
			return { ok: false, kind: "api_error" };
		}
	} catch {
		return { ok: false, kind: "network_error" };
	}
}

function readUuid(payload: unknown): string | undefined {
	if (!payload || typeof payload !== "object") {
		return undefined;
	}
	const uuid = (payload as { uuid?: unknown }).uuid;
	return typeof uuid === "string" && uuid.length > 0 ? uuid : undefined;
}

/**
 * Coolify Cloud application status. Failures degrade to network_error / api_error
 * so callers never throw, and the status panel can show "temporarily unavailable"
 * instead of a false "site is down".
 */
export async function fetchCoolifyAppStatus(coolifyAppId: string, apiToken: string): Promise<CoolifyStatusProbe> {
	const result = await coolifyRequest(`/applications/${coolifyAppId}`, apiToken, { method: "GET" });
	if (!result.ok) {
		return { kind: result.kind };
	}
	const body = result.data as { status?: string; fqdn?: string; updated_at?: string };
	if (!body.fqdn) {
		return { kind: "api_error" };
	}
	return {
		kind: "ok",
		reachable: typeof body.status === "string" && body.status.startsWith("running"),
		publicUrl: body.fqdn,
		lastDeployedAt: body.updated_at,
	};
}

export async function addServerToCoolify(args: {
	ip: string;
	publicKey: string;
	name: string;
	apiToken: string;
	privateKeyUuid?: string;
}): Promise<CoolifyWriteResult<{ uuid: string }>> {
	const payload: Record<string, unknown> = {
		name: args.name,
		ip: args.ip,
		user: "root",
		port: 22,
		instant_validate: true,
		public_key: args.publicKey,
	};
	if (args.privateKeyUuid) {
		payload.private_key_uuid = args.privateKeyUuid;
	}

	const result = await coolifyRequest("/servers", args.apiToken, {
		method: "POST",
		body: JSON.stringify(payload),
	});
	if (!result.ok) {
		return result;
	}
	const uuid = readUuid(result.data);
	if (!uuid) {
		return { ok: false, kind: "api_error" };
	}
	return { ok: true, data: { uuid } };
}

export async function createApplication(args: {
	serverId: string;
	repoUrl: string;
	branch: string;
	apiToken: string;
	projectUuid?: string;
	environmentName?: string;
	buildPack?: string;
}): Promise<CoolifyWriteResult<{ uuid: string }>> {
	const projectUuid = args.projectUuid?.trim();
	if (!projectUuid) {
		return { ok: false, kind: "api_error" };
	}

	const result = await coolifyRequest("/applications/public", args.apiToken, {
		method: "POST",
		body: JSON.stringify({
			project_uuid: projectUuid,
			server_uuid: args.serverId,
			environment_name: args.environmentName?.trim() || "production",
			git_repository: args.repoUrl,
			git_branch: args.branch,
			build_pack: args.buildPack || "nixpacks",
		}),
	});
	if (!result.ok) {
		return result;
	}
	const uuid = readUuid(result.data);
	if (!uuid) {
		return { ok: false, kind: "api_error" };
	}
	return { ok: true, data: { uuid } };
}

export async function setApplicationEnv(args: {
	appId: string;
	key: string;
	value: string;
	apiToken: string;
}): Promise<CoolifyWriteResult<{ uuid: string }>> {
	const result = await coolifyRequest(`/applications/${args.appId}/envs`, args.apiToken, {
		method: "POST",
		body: JSON.stringify({
			key: args.key,
			value: args.value,
			is_shown_once: true,
		}),
	});
	if (!result.ok) {
		return result;
	}
	const uuid = readUuid(result.data);
	if (!uuid) {
		return { ok: false, kind: "api_error" };
	}
	return { ok: true, data: { uuid } };
}

export async function redeployApplication(args: {
	appId: string;
	apiToken: string;
}): Promise<CoolifyWriteResult<{ queued: true }>> {
	const result = await coolifyRequest(`/applications/${args.appId}/restart`, args.apiToken, {
		method: "POST",
	});
	if (!result.ok) {
		return result;
	}
	return { ok: true, data: { queued: true } };
}
