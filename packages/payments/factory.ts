import type { PayUniCredentials } from "./provider/payuni/gateway";
import { PayUniOneTimeGateway } from "./provider/payuni/gateway";
import { ShoplineGateway, type ShoplineConfig } from "./provider/shopline/gateway";
import { StripeGateway, type StripeCheckoutConfig } from "./provider/stripe/gateway";
import type { CheckoutGateway, CheckoutGatewayType } from "./types";

export type CheckoutGatewayCredentials = PayUniCredentials | ShoplineConfig | StripeCheckoutConfig;

export function createMvpCheckoutGateway(
	gateway: string,
	credentials: CheckoutGatewayCredentials,
): CheckoutGateway {
	switch (gateway as CheckoutGatewayType) {
		case "payuni":
			return new PayUniOneTimeGateway(credentials as PayUniCredentials);
		case "shopline":
			return new ShoplineGateway(credentials as ShoplineConfig);
		case "stripe":
			return new StripeGateway(credentials as StripeCheckoutConfig);
		default:
			throw new Error(`Unsupported checkout gateway: ${gateway}`);
	}
}
