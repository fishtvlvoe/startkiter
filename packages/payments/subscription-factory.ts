import type { SubscriptionGateway } from "./types";
import { PayUniPeriodGateway } from "./provider/payuni/period-gateway";
import type { PayUniCredentials } from "./provider/payuni/gateway";

/** Return the concrete provider behind the provider-neutral subscription contract. */
export function createPayUniSubscriptionGateway(credentials: PayUniCredentials): SubscriptionGateway {
	return new PayUniPeriodGateway(credentials);
}
