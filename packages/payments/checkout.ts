import { MVP_AMOUNT_TWD, MVP_SKU } from "./constants";
import { createMvpCheckoutGateway } from "./factory";
import type { CheckoutGatewayCredentials } from "./factory";
import type { OrderStore } from "./memory-store";
import { buildPendingOrderInput } from "./order";
import type { CheckoutGatewayType, CheckoutPaymentSessionResult } from "./types";

export type CheckoutResult =
	| {
		status: 200;
		order: ReturnType<OrderStore["create"]>;
		payment: CheckoutPaymentSessionResult;
	}
	| { status: 401 | 400 | 503; error: string };

export async function createCheckout(args: {
	userId: string | null;
	sessionPresent: boolean;
	requestedSku?: string;
	requestedAmount?: number;
	credentials: CheckoutGatewayCredentials | null;
	gateway?: CheckoutGatewayType;
	store: OrderStore;
	baseUrl: string;
	customerEmail?: string;
}): Promise<CheckoutResult> {
	if (!args.sessionPresent || !args.userId) {
		return { status: 401, error: "authentication_required" };
	}

	if (!args.credentials) {
		return { status: 503, error: "checkout_gateway_not_configured" };
	}

	if (args.requestedSku !== undefined && args.requestedSku !== MVP_SKU) {
		return { status: 400, error: "invalid_sku" };
	}

	const pending = buildPendingOrderInput({
		userId: args.userId,
		sku: MVP_SKU,
		amount: MVP_AMOUNT_TWD,
		paymentGateway: args.gateway ?? "payuni",
	});

	const order = args.store.create(pending);
	const gateway = createMvpCheckoutGateway(args.gateway ?? "payuni", args.credentials);
	const payment = await gateway.createPaymentSession({
		orderNo: order.orderNo,
		amount: order.amount,
		productTitle: "StartKiter MVP",
		customerEmail: args.customerEmail,
		baseUrl: args.baseUrl,
	});

	return { status: 200, order, payment };
}
