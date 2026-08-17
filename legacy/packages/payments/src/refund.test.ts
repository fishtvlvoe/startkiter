import { describe, expect, it, vi } from "vitest";

import { MVP_AMOUNT_TWD, MVP_SKU } from "./constants";
import { createMemoryOrderStore } from "./memory-store";
import { markOrderRefunded } from "./refund";

describe("Refund clears entitlement flags", () => {
	it("sets refunded and clears both flags for SK-8800-001", () => {
		const store = createMemoryOrderStore();
		store.create({
			userId: "user_1",
			orderNo: "SK-8800-001",
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: "TWD",
			status: "paid",
			paymentGateway: "payuni",
			gatewayTradeNo: "PU_TRADE_1",
			courseAccess: true,
			kitClaimEligible: true,
		});

		const githubSpy = vi.fn();
		const updated = markOrderRefunded({
			orderNo: "SK-8800-001",
			store,
			githubCollaboratorApi: githubSpy,
		});

		expect(updated.status).toBe("refunded");
		expect(updated.courseAccess).toBe(false);
		expect(updated.kitClaimEligible).toBe(false);
		expect(githubSpy).not.toHaveBeenCalled();
	});

	it("keeps durable false flags for later claim handlers on SK-8800-002", () => {
		const store = createMemoryOrderStore();
		store.create({
			userId: "user_1",
			orderNo: "SK-8800-002",
			sku: MVP_SKU,
			amount: MVP_AMOUNT_TWD,
			currency: "TWD",
			status: "paid",
			paymentGateway: "payuni",
			gatewayTradeNo: "PU_TRADE_2",
			courseAccess: true,
			kitClaimEligible: true,
		});

		markOrderRefunded({
			orderNo: "SK-8800-002",
			store,
			githubCollaboratorApi: vi.fn(),
		});

		const row = store.getByOrderNo("SK-8800-002");
		expect(row?.kitClaimEligible).toBe(false);
		expect(row?.courseAccess).toBe(false);
	});
});
