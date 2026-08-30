import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/coupons", () => ({
	validateCoupon: vi.fn(),
}));

vi.mock("../../../../lib/rate-limit", () => ({
	checkRateLimit: vi.fn(() => true),
	resolveTrustedClientIp: vi.fn((forwardedFor: string | null) => {
		if (!forwardedFor || forwardedFor.trim() === "") return "unknown";
		const parts = forwardedFor
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean);
		const trustedProxyCount = 1;
		return parts[Math.max(0, parts.length - trustedProxyCount)] ?? "unknown";
	}),
}));

import { validateCoupon } from "@startkiter/coupons";

import { checkRateLimit } from "../../../../lib/rate-limit";
import { POST } from "./route";

const mockedValidateCoupon = vi.mocked(validateCoupon);
const mockedCheckRateLimit = vi.mocked(checkRateLimit);

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
	return new Request("http://localhost/api/coupons/validate", {
		method: "POST",
		headers: { "content-type": "application/json", ...headers },
		body: JSON.stringify(body),
	});
}

describe("POST /api/coupons/validate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedCheckRateLimit.mockReturnValue(true);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns 200 with discount for a valid coupon (Example: 固定金額折扣)", async () => {
		mockedValidateCoupon.mockResolvedValue({ valid: true, discountAmount: 100, finalAmount: 8700 });

		const response = await POST(jsonRequest({ code: "SAVE100", productId: "startkiter-mvp" }));

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ valid: true, discountAmount: 100, finalAmount: 8700 });
	});

	it("returns 200 with reason not_found for a nonexistent code (not 404, avoids enumeration leak)", async () => {
		mockedValidateCoupon.mockResolvedValue({ valid: false, reason: "not_found" });

		const response = await POST(jsonRequest({ code: "NOSUCH", productId: "startkiter-mvp" }));

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body).toEqual({ valid: false, reason: "not_found" });
	});

	it("returns 200 with reason expired for an expired code (fail-closed payload, not 4xx)", async () => {
		mockedValidateCoupon.mockResolvedValue({ valid: false, reason: "expired" });

		const response = await POST(jsonRequest({ code: "EXPIRED1", productId: "startkiter-mvp" }));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ valid: false, reason: "expired" });
	});

	it("does not require a session (anonymous validation still rate-limited)", async () => {
		mockedValidateCoupon.mockResolvedValue({ valid: true, discountAmount: 100, finalAmount: 8700 });

		const response = await POST(jsonRequest({ code: "SAVE100", productId: "startkiter-mvp" }));

		expect(response.status).toBe(200);
		expect(response.status).not.toBe(401);
	});

	it("returns 400 for a malformed body without calling validateCoupon", async () => {
		const response = await POST(jsonRequest({ productId: "startkiter-mvp" }));

		expect(response.status).toBe(400);
		expect(mockedValidateCoupon).not.toHaveBeenCalled();
	});

	it("returns 429 when the rate limit is exceeded for the requesting client", async () => {
		mockedCheckRateLimit.mockReturnValue(false);

		const response = await POST(
			jsonRequest({ code: "SAVE100", productId: "startkiter-mvp" }, { "x-forwarded-for": "1.2.3.4" }),
		);

		expect(response.status).toBe(429);
		expect(mockedValidateCoupon).not.toHaveBeenCalled();
	});
});
