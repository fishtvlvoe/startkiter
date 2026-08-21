import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { afterEach, describe, expect, it } from "vitest";

import { MVP_AMOUNT_TWD, MVP_CURRENCY, MVP_SKU } from "./constants";
import { getProduct } from "./catalog";

describe.sequential("packages/payments getProduct", () => {
	const createdBundleIds: string[] = [];

	afterEach(async () => {
		for (const id of createdBundleIds.splice(0)) {
			await db.bundle.delete({ where: { id } }).catch(() => {});
		}
	});

	async function createTestBundle(overrides: { status?: string; priceTwd?: number } = {}) {
		const bundle = await db.bundle.create({
			data: {
				slug: `catalog-payments-test-${randomUUID()}`,
				title: "測試組合包",
				priceTwd: overrides.priceTwd ?? 6000,
				status: overrides.status ?? "published",
			},
		});
		createdBundleIds.push(bundle.id);
		return bundle;
	}

	it("回傳 MVP SKU 固定 8800（未傳 productId，Scenario: Checkout amount is 8800 TWD for the MVP SKU）", async () => {
		const product = await getProduct();
		expect(product).toEqual({ productId: MVP_SKU, sku: MVP_SKU, amount: MVP_AMOUNT_TWD, currency: MVP_CURRENCY });
	});

	it("傳入 startkiter-mvp 時同樣回傳固定 8800", async () => {
		const product = await getProduct(MVP_SKU);
		expect(product).toEqual({ productId: MVP_SKU, sku: MVP_SKU, amount: MVP_AMOUNT_TWD, currency: MVP_CURRENCY });
	});

	it("傳入已發布 bundle id 時回傳該 bundle 自己的價格（Scenario: Checkout amount for a bundle product uses the bundle's configured price）", async () => {
		const bundle = await createTestBundle({ priceTwd: 6000 });

		const product = await getProduct(bundle.id);

		expect(product).toEqual({ productId: bundle.id, sku: bundle.id, amount: 6000, currency: MVP_CURRENCY });
	});

	it("傳入 draft 狀態的 bundle id 時回傳 null（未發布不可結帳）", async () => {
		const bundle = await createTestBundle({ status: "draft" });

		const product = await getProduct(bundle.id);

		expect(product).toBeNull();
	});

	it("傳入不存在的 productId 時回傳 null", async () => {
		const product = await getProduct("nonexistent-id");

		expect(product).toBeNull();
	});
});
