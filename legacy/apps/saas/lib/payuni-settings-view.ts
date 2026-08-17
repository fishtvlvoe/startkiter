import { resolvePayUniCredentials, type PayUniEnv } from "@startkiter/payments";

import { maskSecret } from "./settings-crypto";
import type { PayuniPlainSettings } from "./payuni-settings";

export type PayuniSettingsPublic = {
	merchantId: string;
	hashKeyMasked: string;
	hashIVMasked: string;
	apiUrl: string;
	source: "settings" | "env" | "none";
};

function settingsAreComplete(settings: PayuniPlainSettings | null): settings is PayuniPlainSettings {
	return Boolean(settings?.merchantId && settings.hashKey && settings.hashIV);
}

export function presentPayuniSettings(args: {
	settings: PayuniPlainSettings | null;
	env: PayUniEnv;
}): PayuniSettingsPublic {
	if (settingsAreComplete(args.settings)) {
		return {
			merchantId: args.settings.merchantId,
			hashKeyMasked: maskSecret(args.settings.hashKey),
			hashIVMasked: maskSecret(args.settings.hashIV),
			apiUrl: args.settings.apiUrl,
			source: "settings",
		};
	}

	const fromEnv = resolvePayUniCredentials({
		readSettings: () => null,
		env: args.env,
	});
	if (fromEnv) {
		return {
			merchantId: fromEnv.merchantId,
			hashKeyMasked: maskSecret(fromEnv.hashKey),
			hashIVMasked: maskSecret(fromEnv.hashIV),
			apiUrl: fromEnv.apiUrl,
			source: "env",
		};
	}

	return {
		merchantId: args.env.PAYUNI_MERCHANT_ID ?? "",
		hashKeyMasked: maskSecret(args.env.PAYUNI_HASH_KEY),
		hashIVMasked: maskSecret(args.env.PAYUNI_HASH_IV),
		apiUrl: args.env.PAYUNI_API_URL ?? "",
		source: "none",
	};
}
