import type { CheckContext, CheckImplementation, CheckResult } from "../check-registry";

export const BUNNY_API_KEY_FIELD = "bunnyApiKey";
export const BUNNY_STORAGE_ZONES_URL = "https://api.bunny.net/storagezone";
const REQUEST_TIMEOUT_MS = 10_000;

type BunnyFetch = typeof fetch;

export function createBunnyZoneCreatedCheck(deps: { fetch?: BunnyFetch } = {}): CheckImplementation {
	const fetchImpl = deps.fetch ?? fetch;

	return async (params: Record<string, string>, context: CheckContext): Promise<CheckResult> => {
		const fieldKey = params.field_key?.trim() || BUNNY_API_KEY_FIELD;
		const apiKey = context.formValues[fieldKey]?.trim();
		if (!apiKey) {
			return { status: "pending" };
		}

		try {
			const response = await fetchImpl(BUNNY_STORAGE_ZONES_URL, {
				method: "GET",
				headers: {
					AccessKey: apiKey,
					Accept: "application/json",
				},
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			});

			if (response.status === 401 || response.status === 403) {
				return { status: "failed", reasonCode: "auth_error" };
			}

			if (response.status === 404) {
				return { status: "failed", reasonCode: "not_found" };
			}

			if (!response.ok) {
				return { status: "failed", reasonCode: "network_error" };
			}

			const payload: unknown = await response.json();
			const zones = Array.isArray(payload) ? payload : [];
			const zoneName = params.zone_name?.trim();
			const matched = zoneName
				? zones.some((zone) => isNamedZone(zone, zoneName))
				: zones.length > 0;

			return matched ? { status: "passed" } : { status: "pending" };
		} catch {
			return { status: "failed", reasonCode: "network_error" };
		}
	};
}

export const checkBunnyZoneCreated: CheckImplementation = createBunnyZoneCreatedCheck();

function isNamedZone(zone: unknown, zoneName: string): boolean {
	return Boolean(
		zone &&
			typeof zone === "object" &&
			"Name" in zone &&
			typeof zone.Name === "string" &&
			zone.Name === zoneName,
	);
}
