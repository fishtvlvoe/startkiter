import { MVP_AMOUNT_TWD, MVP_SKU } from "./constants";
import { createMvpCheckoutGateway } from "./factory";
import type { OrderStore } from "./memory-store";
import { buildPendingOrderInput } from "./order";
import type { PayUniCredentials } from "./provider/payuni/gateway";

export type CheckoutResult =
	| {
			status: 200;
			order: ReturnType<OrderStore["create"]>;
			payment: ReturnType<ReturnType<typeof createMvpCheckoutGateway>["createPaymentSession"]>;
	  }
	| { status: 401 | 400 | 503; error: string };

export async function createCheckout(args: {
	userId: string | null;
	sessionPresent: boolean;
	requestedSku?: string;
	requestedAmount?: number;
	credentials: PayUniCredentials | null;
	store: OrderStore;
	baseUrl: string;
	customerEmail?: string;
}): Promise<CheckoutResult> {
	if (!args.sessionPresent || !args.userId) {
		return { status: 401, error: "authentication_required" };
	}

	if (!args.credentials) {
		return { status: 503, error: "payuni_not_configured" };
	}

	if (args.requestedSku !== undefined && args.requestedSku !== MVP_SKU) {
		return { status: 400, error: "invalid_sku" };
	}

	const pending = buildPendingOrderInput({
		userId: args.userId,
		sku: MVP_SKU,
		amount: MVP_AMOUNT_TWD,
	});

	const order = args.store.create(pending);
	const gateway = createMvpCheckoutGateway("payuni", args.credentials);
	const payment = gateway.createPaymentSession({
		orderNo: order.orderNo,
		amount: order.amount,
		productTitle: "StartKiter MVP",
		customerEmail: args.customerEmail,
		baseUrl: args.baseUrl,
	});

	return { status: 200, order, payment };
}
