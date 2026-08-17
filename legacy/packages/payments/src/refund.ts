import type { OrderRecord, OrderStore } from "./memory-store";

export function markOrderRefunded(args: {
	orderNo: string;
	store: OrderStore;
	githubCollaboratorApi?: (...params: unknown[]) => unknown;
}): OrderRecord {
	const updated = args.store.update(args.orderNo, {
		status: "refunded",
		courseAccess: false,
		kitClaimEligible: false,
		refundedAt: new Date(),
	});
	// 本刀不得呼叫 GitHub；spy 可注入以證明未呼叫
	void args.githubCollaboratorApi;
	return updated;
}
