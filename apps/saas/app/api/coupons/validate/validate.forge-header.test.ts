import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Red-light（coupon-security-fixes / task 3.1）：
 * 匿名客戶端每次換不同 x-forwarded-for（左側偽造 + 右側真實 IP）不得繞過 20/min。
 * 現行 route 把完整 header 當 rate-limit key，偽造左側即可開新桶。
 *
 * 部署假設（Phase 2 依 task 1.1 定案；Codex 補強後）：`TRUSTED_PROXY_COUNT` 預設 1
 * （Coolify + Traefik 單層）。從右往左數 N 段；Cloudflare 目前灰雲，不依賴 cf-connecting-ip。
 */

vi.mock("@startkiter/coupons", () => ({
	validateCoupon: vi.fn(),
}));

import { validateCoupon } from "@startkiter/coupons";

import { POST } from "./route";

const mockedValidateCoupon = vi.mocked(validateCoupon);

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/coupons/validate", {
		method: "POST",
		headers: { "content-type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

describe("POST /api/coupons/validate forged x-forwarded-for bypass", () => {
	const realClientIp = `203.0.113.${(Date.now() % 200) + 1}`;

	beforeEach(() => {
		vi.clearAllMocks();
		mockedValidateCoupon.mockResolvedValue({
			valid: true,
			discountAmount: 100,
			finalAmount: 8700,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("still rate-limits when the client forges a different left-most x-forwarded-for each request", async () => {
		// 超過 20/min：每個請求換偽造左側，右側維持同一真實來源（Traefik append 型態）
		const responses = await Promise.all(
			Array.from({ length: 25 }, (_, index) =>
				POST(
					jsonRequest(
						{ code: "SAVE100", productId: "startkiter-mvp" },
						{ "x-forwarded-for": `198.51.100.${index}, ${realClientIp}` },
					),
				),
			),
		);

		const rateLimitedCount = responses.filter((response) => response.status === 429).length;

		expect(rateLimitedCount).toBeGreaterThan(0);
	});
});
