import type { CoolifyStatusProbe } from "./status";

/**
 * Minimal Coolify Cloud API client for reading an application's live status.
 *
 * NOT independently verified against a real Coolify response yet — the exact
 * response shape below is a best-effort guess from Coolify's public API docs,
 * not confirmed against a live call. Any mismatch (wrong field names, wrong
 * path) degrades safely to { kind: "api_error" } via the catch block, which
 * is the same fail-safe state required by buyer-status-panel spec, so a
 * wrong guess here cannot cause a false "site is down" report — worst case
 * it always shows "status temporarily unavailable" until this is corrected
 * against a real account.
 */
export async function fetchCoolifyAppStatus(
	coolifyAppId: string,
	apiToken: string,
): Promise<CoolifyStatusProbe> {
	try {
		const response = await fetch(`https://app.coolify.io/api/v1/applications/${coolifyAppId}`, {
			headers: { Authorization: `Bearer ${apiToken}` },
		});
		if (!response.ok) {
			return { kind: "api_error" };
		}
		const body = (await response.json()) as {
			status?: string;
			fqdn?: string;
			updated_at?: string;
		};
		if (!body.fqdn) {
			return { kind: "api_error" };
		}
		return {
			kind: "ok",
			reachable: typeof body.status === "string" && body.status.startsWith("running"),
			publicUrl: body.fqdn,
			lastDeployedAt: body.updated_at,
		};
	} catch {
		return { kind: "api_error" };
	}
}
