import type { CheckoutGatewayType } from "./types";

export type OrderStatus = "pending" | "paid" | "refunded";

export type OrderRecord = {
	id: string;
	userId: string;
	orderNo: string;
	sku: string;
	amount: number;
	currency: string;
	status: OrderStatus;
	paymentGateway: CheckoutGatewayType;
	gatewayTradeNo: string | null;
	courseAccess: boolean;
	kitClaimEligible: boolean;
	paidAt: Date | null;
	refundedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type OrderStore = {
	list: () => OrderRecord[];
	create: (
		input: Omit<OrderRecord, "id" | "paidAt" | "refundedAt" | "createdAt" | "updatedAt"> & {
			paidAt?: Date | null;
			refundedAt?: Date | null;
		},
	) => OrderRecord;
	getByOrderNo: (orderNo: string) => OrderRecord | undefined;
	update: (orderNo: string, patch: Partial<OrderRecord>) => OrderRecord;
};

export function createMemoryOrderStore(): OrderStore {
	const rows: OrderRecord[] = [];
	let seq = 0;

	return {
		list: () => [...rows],
		create: (input) => {
			const now = new Date();
			const row: OrderRecord = {
				id: `ord_${++seq}`,
				paidAt: input.paidAt ?? null,
				refundedAt: input.refundedAt ?? null,
				createdAt: now,
				updatedAt: now,
				...input,
			};
			rows.push(row);
			return row;
		},
		getByOrderNo: (orderNo) => rows.find((row) => row.orderNo === orderNo),
		update: (orderNo, patch) => {
			const index = rows.findIndex((row) => row.orderNo === orderNo);
			if (index < 0) {
				throw new Error(`Order not found: ${orderNo}`);
			}
			const current = rows[index]!;
			const next = { ...current, ...patch, updatedAt: new Date() };
			rows[index] = next;
			return next;
		},
	};
}
