import { call } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		courseSubscriptionPlan: { findUnique: vi.fn() },
		courseSubscription: {
			findFirst: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			findUnique: vi.fn(),
			update: vi.fn(),
			updateMany: vi.fn(),
		},
		siteSetting: { findUnique: vi.fn() },
	},
}));

vi.mock("../lib/subscription-gateway", () => ({
	getPayUniSubscriptionGateway: vi.fn(),
	resolveSubscriptionBaseUrl: vi.fn(() => "https://startkiter.example"),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";

import { getPayUniSubscriptionGateway } from "../lib/subscription-gateway";
import { cancelCourseSubscription } from "./cancel-course-subscription";
import { createSubscriptionCheckout } from "./create-subscription-checkout";

const user = { id: "buyer-1", email: "buyer@example.com" };
const session = { session: { id: "session-1", userId: user.id }, user };
const plan = {
	id: "plan-monthly",
	courseId: "course-a",
	label: "每月方案",
	interval: "MONTH" as const,
	price: 390,
	sku: "course-a-monthly",
	enabled: true,
	course: { id: "course-a", title: "Course A" },
};
const payment = {
	type: "form_post" as const,
	formData: {
		apiUrl: "https://sandbox-api.payuni.com.tw/api/period/Page",
		MerID: "MERCHANT",
		Version: "1.0",
		EncryptInfo: "encrypted",
		HashInfo: "hash",
	},
	gatewaySessionId: "trade-1",
};

describe("subscription procedures", () => {
	const gateway = {
		createSubscriptionSession: vi.fn(),
		cancelSubscription: vi.fn(),
		queryPeriod: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(auth.api.getSession).mockResolvedValue(session as never);
		vi.mocked(getPayUniSubscriptionGateway).mockResolvedValue(gateway);
		vi.mocked(db.courseSubscriptionPlan.findUnique).mockResolvedValue(plan as never);
		vi.mocked(db.courseSubscription.findFirst).mockResolvedValue(null);
		vi.mocked(db.courseSubscription.create).mockResolvedValue({
			id: "subscription-1",
			userId: user.id,
			courseId: plan.courseId,
			planId: plan.id,
			status: "PENDING",
			gatewayTradeNo: "SUBTRADE",
			interval: "MONTH",
			pricePerPeriod: plan.price,
		} as never);
		gateway.createSubscriptionSession.mockResolvedValue(payment);
	});

	it("creates a pending subscription and returns the PAYUNi form payload", async () => {
		const result = await call(
			createSubscriptionCheckout,
			{ planId: plan.id },
			{ context: { headers: new Headers(), url: "https://startkiter.example/api/rpc" } as never },
		);

		expect(result).toMatchObject({ subscriptionId: "subscription-1", planId: plan.id, payment });
		expect(db.courseSubscription.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: user.id,
					courseId: plan.courseId,
					planId: plan.id,
					status: "PENDING",
					interval: "MONTH",
					pricePerPeriod: 390,
				}),
			}),
		);
	});

	it("rejects a second pending or active subscription for the same course", async () => {
		vi.mocked(db.courseSubscription.findFirst).mockResolvedValue({ id: "existing" } as never);

		await expect(
			call(
				createSubscriptionCheckout,
				{ planId: plan.id },
				{ context: { headers: new Headers(), url: "https://startkiter.example/api/rpc" } as never },
			),
		).rejects.toMatchObject({ code: "CONFLICT" });
		expect(db.courseSubscription.create).not.toHaveBeenCalled();
	});

	it("maps the database partial-unique race to a conflict instead of a 500", async () => {
		vi.mocked(db.courseSubscription.create).mockRejectedValueOnce({ code: "P2002" });

		await expect(
			call(
				createSubscriptionCheckout,
				{ planId: plan.id },
				{ context: { headers: new Headers(), url: "https://startkiter.example/api/rpc" } as never },
			),
		).rejects.toMatchObject({ code: "CONFLICT" });
		expect(gateway.createSubscriptionSession).not.toHaveBeenCalled();
	});

	it("rejects an unauthenticated checkout before creating a subscription", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);

		await expect(
			call(
				createSubscriptionCheckout,
				{ planId: plan.id },
				{ context: { headers: new Headers(), url: "https://startkiter.example/api/rpc" } as never },
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
		expect(db.courseSubscription.create).not.toHaveBeenCalled();
	});

	it("cancels only the authenticated buyer's subscription after gateway success", async () => {
		vi.mocked(db.courseSubscription.findUnique).mockResolvedValue({
			id: "subscription-1",
			userId: user.id,
			status: "ACTIVE",
			gatewaySubscriptionId: "PERIOD-1",
		} as never);
		gateway.cancelSubscription.mockResolvedValue({ success: true });
		vi.mocked(db.courseSubscription.update).mockResolvedValue({ id: "subscription-1", status: "CANCELED" } as never);

		await call(
			cancelCourseSubscription,
			{ subscriptionId: "subscription-1" },
			{ context: { headers: new Headers() } as never },
		);

		expect(gateway.cancelSubscription).toHaveBeenCalledWith({ gatewaySubscriptionId: "PERIOD-1" });
		expect(db.courseSubscription.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "subscription-1" },
				data: expect.objectContaining({ status: "CANCELED" }),
			}),
		);
	});

	it("leaves the subscription unchanged when gateway cancellation fails", async () => {
		vi.mocked(db.courseSubscription.findUnique).mockResolvedValue({
			id: "subscription-1",
			userId: user.id,
			status: "ACTIVE",
			gatewaySubscriptionId: "PERIOD-1",
		} as never);
		gateway.cancelSubscription.mockResolvedValue({ success: false, error: "declined" });

		await expect(
			call(
				cancelCourseSubscription,
				{ subscriptionId: "subscription-1" },
				{ context: { headers: new Headers() } as never },
			),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(db.courseSubscription.update).not.toHaveBeenCalled();
	});
});
