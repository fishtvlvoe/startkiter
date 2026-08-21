import { getBundleById } from "@startkiter/bundles";

import { MVP_AMOUNT_TWD, MVP_CURRENCY, MVP_SKU } from "./constants";

export type Product = {
	productId: string;
	sku: string;
	amount: number;
	currency: "TWD";
};

/**
 * 商品目錄（design.md 決策：商品目錄取代寫死常數）。未傳入或傳入 MVP_SKU 時回傳固定 8800 的
 * MVP 商品；其餘視為 bundle id，查 packages/bundles，未發布/不存在回傳 null（呼叫端據此回 404）。
 */
export async function getProduct(productId: string = MVP_SKU): Promise<Product | null> {
	if (productId === MVP_SKU) {
		return { productId: MVP_SKU, sku: MVP_SKU, amount: MVP_AMOUNT_TWD, currency: MVP_CURRENCY };
	}

	const bundle = await getBundleById(productId);
	if (!bundle || bundle.status !== "published") {
		return null;
	}

	return { productId: bundle.id, sku: bundle.id, amount: bundle.priceTwd, currency: MVP_CURRENCY };
}
