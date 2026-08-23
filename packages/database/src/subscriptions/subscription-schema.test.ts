import { describe, expect, it } from "vitest";

import type { Prisma } from "../../prisma/generated/client";

describe("recurring billing schema contract", () => {
	it("keeps subscription plans attached to an arbitrary course", () => {
		const plan = {
			course: { connect: { id: "course-not-mvp" } },
			label: "Other course monthly",
			interval: "MONTH",
			price: 390,
			sku: "other-course-monthly",
		} satisfies Prisma.CourseSubscriptionPlanCreateInput;

		expect(plan.course.connect.id).toBe("course-not-mvp");
		expect(plan.sku).toBe("other-course-monthly");
	});

	it("keeps invoice fields nullable and untouched by the subscription input", () => {
		const invoiceFields: Pick<
			Prisma.CourseSubscriptionCreateInput,
			"invoiceType" | "invoiceCarrierType" | "invoiceCarrierId" | "invoiceTaxId" | "invoiceTitle"
		> = {
			invoiceType: null,
			invoiceCarrierType: null,
			invoiceCarrierId: null,
			invoiceTaxId: null,
			invoiceTitle: null,
		};

		expect(Object.values(invoiceFields)).toEqual([null, null, null, null, null]);
	});
});
