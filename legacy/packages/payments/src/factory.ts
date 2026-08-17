import type { PayUniCredentials } from "./provider/payuni/gateway";
import { PayUniOneTimeGateway } from "./provider/payuni/gateway";

export function createMvpCheckoutGateway(
	gateway: string,
	credentials: PayUniCredentials,
): PayUniOneTimeGateway {
	if (gateway !== "payuni") {
		throw new Error(`MVP checkout gateway must be payuni, got ${gateway}`);
	}
	return new PayUniOneTimeGateway(credentials);
}
