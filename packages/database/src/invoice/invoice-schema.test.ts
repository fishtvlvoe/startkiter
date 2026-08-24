import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { db } from "../../prisma/client";
import type { Prisma } from "../../prisma/generated/client";

describe.sequential("invoice schema contract", () => {
	let userId = "";
	let orderId = "";
	let subscriptionId = "";
	let courseId = "";
	let planId = "";

	beforeAll(async () => {
		const user = await db.user.create({
			data: {
				name: "Invoice schema test user",
				email: `invoice-schema-${randomUUID()}@example.com`,
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		userId = user.id;

		const course = await db.course.create({
			data: {
				slug: `invoice-schema-${randomUUID()}`,
				title: "Invoice schema test course",
			},
		});
		courseId = course.id;

		const plan = await db.courseSubscriptionPlan.create({
			data: {
				courseId,
				label: "Monthly",
				interval: "MONTH",
				price: 390,
				sku: `invoice-schema-${randomUUID()}`,
			},
		});
		planId = plan.id;

		const order = await db.order.create({
			data: {
				orderNo: `INV-${randomUUID()}`,
				userId,
				sku: "invoice-schema-test",
				amount: 8800,
			},
		});
		orderId = order.id;

		const subscription = await db.courseSubscription.create({
			data: {
				userId,
				courseId,
				planId,
				gatewayTradeNo: `INV-SUB-${randomUUID()}`,
				interval: "MONTH",
				pricePerPeriod: 390,
			},
		});
		subscriptionId = subscription.id;
	});

	afterEach(async () => {
		await db.invoice.deleteMany({
			where: { OR: [{ orderId }, { subscriptionId }] },
		});
	});

	afterAll(async () => {
		if (subscriptionId) await db.courseSubscription.delete({ where: { id: subscriptionId } });
		if (courseId) await db.course.delete({ where: { id: courseId } });
		if (orderId) await db.order.delete({ where: { id: orderId } });
		if (userId) await db.user.delete({ where: { id: userId } });
		await db.$disconnect();
	});

	it("accepts an order-backed invoice without subscription fields", () => {
		const input = {
			order: { connect: { id: "order-1" } },
			provider: "ecpay",
			status: "PENDING",
			amount: 8800,
		} satisfies Prisma.InvoiceCreateInput;

		expect(input.order.connect.id).toBe("order-1");
		expect(input.amount).toBe(8800);
	});

	it("persists an order-backed invoice", async () => {
		const created = await db.invoice.create({
			data: { orderId, provider: "ecpay", status: "PENDING", amount: 8800 },
		});

		const found = await db.invoice.findUnique({ where: { id: created.id } });
		expect(found?.orderId).toBe(orderId);
		expect(found?.subscriptionId).toBeNull();
		expect(found?.periodNumber).toBeNull();
	});

	it("accepts a subscription-period invoice without an order", () => {
		const input = {
			subscription: { connect: { id: "subscription-1" } },
			periodNumber: 2,
			provider: "ezpay",
			status: "PENDING",
			amount: 390,
		} satisfies Prisma.InvoiceCreateInput;

		expect(input.subscription.connect.id).toBe("subscription-1");
		expect(input.periodNumber).toBe(2);
	});

	it("persists a subscription-period invoice", async () => {
		const created = await db.invoice.create({
			data: {
				subscriptionId,
				periodNumber: 2,
				provider: "ezpay",
				status: "PENDING",
				amount: 390,
			},
		});

		const found = await db.invoice.findUnique({ where: { id: created.id } });
		expect(found?.orderId).toBeNull();
		expect(found?.subscriptionId).toBe(subscriptionId);
		expect(found?.periodNumber).toBe(2);
	});

	it("keeps the two source shapes mutually exclusive at the contract boundary", () => {
		type Source = Pick<Prisma.InvoiceUncheckedCreateInput, "orderId" | "subscriptionId" | "periodNumber">;
		const orderSource: Source = { orderId: "order-1", subscriptionId: null, periodNumber: null };
		const subscriptionSource: Source = { orderId: null, subscriptionId: "subscription-1", periodNumber: 1 };

		expect(orderSource.orderId).not.toBeNull();
		expect(subscriptionSource.subscriptionId).not.toBeNull();
	});

	it("rejects an invoice that mixes order and subscription sources", async () => {
		await expect(
			db.invoice.create({
				data: {
					orderId,
					subscriptionId,
					periodNumber: 1,
					provider: "ecpay",
					status: "PENDING",
					amount: 8800,
				},
			}),
		).rejects.toMatchObject({ code: "P2039" });
	});

	it("rejects a duplicate subscription period invoice", async () => {
		const data = {
			subscriptionId,
			periodNumber: 1,
			provider: "ezpay",
			status: "PENDING",
			amount: 390,
		} satisfies Prisma.InvoiceUncheckedCreateInput;

		await db.invoice.create({ data });
		await expect(db.invoice.create({ data })).rejects.toMatchObject({ code: "P2002" });
	});
});
