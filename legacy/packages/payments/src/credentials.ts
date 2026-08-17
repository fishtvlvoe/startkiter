export type PaymentSettingsReader = () => Partial<{
	merchantId: string;
	hashKey: string;
	hashIV: string;
	apiUrl: string;
}> | null;

export type PayUniEnv = {
	PAYUNI_MERCHANT_ID?: string;
	PAYUNI_HASH_KEY?: string;
	PAYUNI_HASH_IV?: string;
	PAYUNI_API_URL?: string;
	[key: string]: string | undefined;
};

export type ResolvedPayUniCredentials = {
	merchantId: string;
	hashKey: string;
	hashIV: string;
	apiUrl: string;
};

const DEFAULT_API_URL = "https://sandbox-api.payuni.com.tw/api/upp";

/** settings → env；settings 可回空，但必須先問 settings。無效長度一律當未設定（fail-closed）。 */
export function resolvePayUniCredentials(args: {
	readSettings: PaymentSettingsReader;
	env: PayUniEnv;
}): ResolvedPayUniCredentials | null {
	const settings = args.readSettings() ?? {};
	const merchantId = settings.merchantId || args.env.PAYUNI_MERCHANT_ID || "";
	const hashKey = settings.hashKey || args.env.PAYUNI_HASH_KEY || "";
	const hashIV = settings.hashIV || args.env.PAYUNI_HASH_IV || "";
	const apiUrl = settings.apiUrl || args.env.PAYUNI_API_URL || DEFAULT_API_URL;

	if (!merchantId || !hashKey || !hashIV) {
		return null;
	}

	if (hashKey.length !== 32 || hashIV.length !== 16) {
		return null;
	}

	return { merchantId, hashKey, hashIV, apiUrl };
}
