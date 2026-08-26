import { db } from "@startkiter/database";
import { loadCheckoutGatewayCredentials } from "@startkiter/payments";
import type { CheckoutGatewayType, ShoplineConfig, StripeCheckoutConfig } from "@startkiter/payments";

import { decryptSettingsJson, encryptSettingsJson } from "./settings-crypto";

export const CHECKOUT_GATEWAY_SETTING_ID = "checkout-gateway";

type StoredCheckoutSettings = {
	enabledGateway?: CheckoutGatewayType;
	gateway?: CheckoutGatewayType;
	shopline?: Partial<ShoplineConfig>;
	stripe?: Partial<StripeCheckoutConfig>;
	testMode?: boolean;
};

export type CheckoutGatewaySettingsSummary = {
	gateway: CheckoutGatewayType;
	shoplineConfigured: boolean;
	stripeConfigured: boolean;
	testMode: boolean;
};

function settingsSecret(): string {
	return process.env.SETTINGS_ENCRYPTION_KEY ?? "";
}

function envOrStored(value: string | undefined, envName: string): string {
	return value?.trim() || process.env[envName]?.trim() || "";
}

function parseStoredSettings(json: string | null): StoredCheckoutSettings {
	if (!json) return {};
	try {
		const value: unknown = JSON.parse(json);
		if (!value || typeof value !== "object" || Array.isArray(value)) return {};
		return value as StoredCheckoutSettings;
	} catch {
		return {};
	}
}

async function readStoredSettings(): Promise<StoredCheckoutSettings> {
	const secret = settingsSecret();
	if (!secret) return {};
	try {
		const row = await db.siteSetting.findUnique({ where: { id: CHECKOUT_GATEWAY_SETTING_ID } });
		return parseStoredSettings(row ? decryptSettingsJson(row.ciphertext, secret) : null);
	} catch {
		return {};
	}
}

export async function loadGatewayCredentials(requestedGateway?: CheckoutGatewayType): Promise<
	Awaited<ReturnType<typeof loadCheckoutGatewayCredentials>>
> {
	return loadCheckoutGatewayCredentials(requestedGateway);
}

export const loadEnabledGatewayCredentials = loadGatewayCredentials;

export async function getCheckoutGatewaySettings(): Promise<CheckoutGatewaySettingsSummary> {
	const stored = await readStoredSettings();
	const active = await loadGatewayCredentials();
	const shopline = await loadGatewayCredentials("shopline");
	const stripe = await loadGatewayCredentials("stripe");
	const shoplineTestMode = shopline?.gateway === "shopline" && "testMode" in shopline.credentials
		? Boolean(shopline.credentials.testMode)
		: undefined;
	return {
		gateway: active?.gateway ?? stored.enabledGateway ?? stored.gateway ?? "payuni",
		shoplineConfigured: Boolean(shopline),
		stripeConfigured: Boolean(stripe),
		testMode: shoplineTestMode ?? stored.shopline?.testMode ?? stored.testMode ?? process.env.SHOPLINE_TEST_MODE !== "false",
	};
}

export async function writeCheckoutGatewaySettings(args: {
	actorUserId: string;
	patch: {
		gateway: CheckoutGatewayType;
		shoplineMerchantId?: string;
		shoplineApiKey?: string;
		shoplineClientKey?: string;
		shoplineSignKey?: string;
		shoplineTestMode?: boolean;
		stripeSecretKey?: string;
		stripeWebhookSecret?: string;
	};
}): Promise<{ ok: true } | { ok: false; error: string; httpStatus: 400 | 503 }> {
	const secret = settingsSecret();
	if (!secret) return { ok: false, error: "encryption_key_required", httpStatus: 503 };
	const previous = await readStoredSettings();
	const next: StoredCheckoutSettings = {
		...previous,
		enabledGateway: args.patch.gateway,
		gateway: args.patch.gateway,
		shopline: {
			...previous.shopline,
			merchantId: args.patch.shoplineMerchantId?.trim() || previous.shopline?.merchantId,
			apiKey: args.patch.shoplineApiKey?.trim() || previous.shopline?.apiKey,
			clientKey: args.patch.shoplineClientKey?.trim() || previous.shopline?.clientKey,
			signKey: args.patch.shoplineSignKey?.trim() || previous.shopline?.signKey,
			testMode: args.patch.shoplineTestMode ?? previous.shopline?.testMode ?? true,
		},
		stripe: {
			...previous.stripe,
			secretKey: args.patch.stripeSecretKey?.trim() || previous.stripe?.secretKey,
			webhookSecret: args.patch.stripeWebhookSecret?.trim() || previous.stripe?.webhookSecret,
		},
	};

	if (
		next.gateway === "shopline" &&
		(!envOrStored(next.shopline?.merchantId, "SHOPLINE_MERCHANT_ID") ||
			!envOrStored(next.shopline?.apiKey, "SHOPLINE_API_KEY") ||
			!envOrStored(next.shopline?.signKey, "SHOPLINE_SIGN_KEY"))
	) {
		return { ok: false, error: "incomplete_shopline_settings", httpStatus: 400 };
	}
	if (
		next.gateway === "stripe" &&
		(!envOrStored(next.stripe?.secretKey, "STRIPE_SECRET_KEY") ||
			!envOrStored(next.stripe?.webhookSecret, "STRIPE_WEBHOOK_SECRET"))
	) {
		return { ok: false, error: "incomplete_stripe_settings", httpStatus: 400 };
	}

	try {
		await db.siteSetting.upsert({
			where: { id: CHECKOUT_GATEWAY_SETTING_ID },
			create: { id: CHECKOUT_GATEWAY_SETTING_ID, ciphertext: encryptSettingsJson(JSON.stringify(next), secret), updatedBy: args.actorUserId },
			update: { ciphertext: encryptSettingsJson(JSON.stringify(next), secret), updatedBy: args.actorUserId },
		});
		return { ok: true };
	} catch {
		return { ok: false, error: "settings_unavailable", httpStatus: 503 };
	}
}
