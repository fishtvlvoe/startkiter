import { createDecipheriv, createHash } from "node:crypto";

import { db } from "@startkiter/database";

import type { CheckoutGatewayCredentials } from "./factory";
import { isValidPayUniCredentials } from "./credentials";
import type { CheckoutGatewayType } from "./types";
import type { PayUniCredentials } from "./provider/payuni/gateway";
import type { ShoplineConfig } from "./provider/shopline/gateway";
import type { StripeCheckoutConfig } from "./provider/stripe/gateway";

type StoredSettings = {
	enabledGateway?: CheckoutGatewayType;
	gateway?: CheckoutGatewayType;
	shopline?: Partial<ShoplineConfig>;
	stripe?: Partial<StripeCheckoutConfig>;
	payuni?: Partial<PayUniCredentials>;
	testMode?: boolean;
};

function decrypt(payload: string, secret: string): string | null {
	if (!secret || !payload.startsWith("v1:")) return null;
	const parts = payload.split(":");
	if (parts.length !== 4) return null;
	try {
		const key = createHash("sha256").update(secret, "utf8").digest();
		const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(parts[1] ?? "", "base64"));
		decipher.setAuthTag(Buffer.from(parts[2] ?? "", "base64"));
		return Buffer.concat([decipher.update(Buffer.from(parts[3] ?? "", "base64")), decipher.final()]).toString("utf8");
	} catch {
		return null;
	}
}

function parse(value: string | null): StoredSettings {
	if (!value) return {};
	try {
		const parsed: unknown = JSON.parse(value);
		return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as StoredSettings : {};
	} catch {
		return {};
	}
}

function envOrStored(stored: string | undefined, envName: string): string {
	return stored?.trim() || process.env[envName]?.trim() || "";
}

const DEFAULT_PAYUNI_API_URL = "https://sandbox-api.payuni.com.tw/api/upp";

async function readSettings(id: string): Promise<StoredSettings> {
	const secret = process.env.SETTINGS_ENCRYPTION_KEY?.trim() ?? "";
	if (!secret) return {};
	try {
		const row = await db.siteSetting.findUnique({ where: { id } });
		const parsed = parse(row ? decrypt(row.ciphertext, secret) : null);
		return id === "payuni" ? { payuni: parsed as Partial<PayUniCredentials> } : parsed;
	} catch {
		return {};
	}
}

/** Resolve one-time checkout credentials for API routes and background actions. */
export async function loadCheckoutGatewayCredentials(requestedGateway?: CheckoutGatewayType): Promise<
	{ gateway: CheckoutGatewayType; credentials: CheckoutGatewayCredentials } | null
> {
	const [checkout, payuniSettings] = await Promise.all([readSettings("checkout-gateway"), readSettings("payuni")]);
	const payuni = payuniSettings.payuni ?? {};
	const gateway = requestedGateway ?? checkout.enabledGateway ?? checkout.gateway ?? "payuni";

	if (gateway === "payuni") {
		const credentials: PayUniCredentials = {
			merchantId: envOrStored(payuni.merchantId, "PAYUNI_MERCHANT_ID"),
			hashKey: envOrStored(payuni.hashKey, "PAYUNI_HASH_KEY"),
			hashIV: envOrStored(payuni.hashIV, "PAYUNI_HASH_IV"),
			apiUrl: envOrStored(payuni.apiUrl, "PAYUNI_API_URL") || DEFAULT_PAYUNI_API_URL,
		};
		return credentials.merchantId && credentials.hashKey && credentials.hashIV && isValidPayUniCredentials(credentials)
			? { gateway, credentials }
			: null;
	}

	if (gateway === "shopline") {
		const credentials: ShoplineConfig = {
			merchantId: envOrStored(checkout.shopline?.merchantId, "SHOPLINE_MERCHANT_ID"),
			apiKey: envOrStored(checkout.shopline?.apiKey, "SHOPLINE_API_KEY"),
			clientKey: envOrStored(checkout.shopline?.clientKey, "SHOPLINE_CLIENT_KEY") || undefined,
			signKey: envOrStored(checkout.shopline?.signKey, "SHOPLINE_SIGN_KEY"),
			testMode: checkout.shopline?.testMode ?? checkout.testMode ?? process.env.SHOPLINE_TEST_MODE !== "false",
		};
		return credentials.merchantId && credentials.apiKey && credentials.signKey ? { gateway, credentials } : null;
	}

	const credentials: StripeCheckoutConfig = {
		secretKey: envOrStored(checkout.stripe?.secretKey, "STRIPE_SECRET_KEY"),
		webhookSecret: envOrStored(checkout.stripe?.webhookSecret, "STRIPE_WEBHOOK_SECRET"),
	};
	return credentials.secretKey && credentials.webhookSecret ? { gateway, credentials } : null;
}
