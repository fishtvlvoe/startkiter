import { resolvePayUniCredentials, type PayUniEnv } from "@startkiter/payments";

import { readPayuniSettingsPlain } from "./site-settings";
import type { PayuniPlainSettings } from "./payuni-settings";

export async function loadPayUniCredentials(opts?: {
	readSettings?: () => Promise<PayuniPlainSettings | null>;
	env?: PayUniEnv;
}) {
	const readSettings = opts?.readSettings ?? readPayuniSettingsPlain;
	const env = opts?.env ?? process.env;
	let settings: PayuniPlainSettings | null = null;
	try {
		settings = await readSettings();
	} catch {
		settings = null;
	}

	return resolvePayUniCredentials({
		readSettings: () => settings,
		env,
	});
}
