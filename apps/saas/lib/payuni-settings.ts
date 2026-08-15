export type PayuniPlainSettings = {
	merchantId: string;
	hashKey: string;
	hashIV: string;
	apiUrl: string;
};

export type PayuniSettingsPatch = {
	merchantId?: string;
	hashKey?: string;
	hashIV?: string;
	apiUrl?: string;
	clear?: boolean;
};

export function validatePayuniPatch(patch: PayuniSettingsPatch): string | null {
	if (patch.hashKey !== undefined && patch.hashKey !== "" && patch.hashKey.length !== 32) {
		return "invalid_hash_key";
	}
	if (patch.hashIV !== undefined && patch.hashIV !== "" && patch.hashIV.length !== 16) {
		return "invalid_hash_iv";
	}
	if (patch.merchantId !== undefined && patch.merchantId.trim() === "") {
		return "invalid_merchant_id";
	}
	return null;
}

export function mergePayuniSettings(
	existing: PayuniPlainSettings | null,
	patch: PayuniSettingsPatch,
): PayuniPlainSettings {
	return {
		merchantId: patch.merchantId?.trim() || existing?.merchantId || "",
		hashKey: patch.hashKey ? patch.hashKey : existing?.hashKey || "",
		hashIV: patch.hashIV ? patch.hashIV : existing?.hashIV || "",
		apiUrl: patch.apiUrl !== undefined ? patch.apiUrl.trim() : existing?.apiUrl || "",
	};
}

export function isClearPayuniPatch(patch: PayuniSettingsPatch): boolean {
	return patch.clear === true;
}

function optionalString(value: unknown): value is string {
	return typeof value === "string";
}

export function parsePayuniPatch(
	body: unknown,
): { ok: true; patch: PayuniSettingsPatch } | { ok: false; error: string } {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return { ok: false, error: "invalid_body" };
	}

	const row = body as Record<string, unknown>;
	if ("clear" in row && typeof row.clear !== "boolean") {
		return { ok: false, error: "invalid_body" };
	}

	for (const key of ["merchantId", "hashKey", "hashIV", "apiUrl"] as const) {
		if (key in row && row[key] !== undefined && !optionalString(row[key])) {
			return { ok: false, error: "invalid_body" };
		}
	}

	return {
		ok: true,
		patch: {
			merchantId: optionalString(row.merchantId) ? row.merchantId : undefined,
			hashKey: optionalString(row.hashKey) ? row.hashKey : undefined,
			hashIV: optionalString(row.hashIV) ? row.hashIV : undefined,
			apiUrl: optionalString(row.apiUrl) ? row.apiUrl : undefined,
			clear: typeof row.clear === "boolean" ? row.clear : undefined,
		},
	};
}
