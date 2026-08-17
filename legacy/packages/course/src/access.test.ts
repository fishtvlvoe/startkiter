import { describe, expect, it } from "vitest";

import { canAccessCourse, type CourseAccessReader } from "./access";

function readerWith(rows: { sku: string; courseAccess: boolean }[]): CourseAccessReader {
	return {
		findOrdersForUser: async () => rows,
	};
}

describe("canAccessCourse", () => {
	it("allows when startkiter-mvp order has courseAccess true", async () => {
		const ok = await canAccessCourse(
			"user_paid",
			readerWith([{ sku: "startkiter-mvp", courseAccess: true }]),
		);
		expect(ok).toBe(true);
	});

	it("denies when no orders", async () => {
		const ok = await canAccessCourse("user_empty", readerWith([]));
		expect(ok).toBe(false);
	});

	it("denies after refund clears courseAccess", async () => {
		const ok = await canAccessCourse(
			"user_refunded",
			readerWith([{ sku: "startkiter-mvp", courseAccess: false }]),
		);
		expect(ok).toBe(false);
	});

	it("ignores other sku even with courseAccess true", async () => {
		const ok = await canAccessCourse(
			"user_other",
			readerWith([{ sku: "other-sku", courseAccess: true }]),
		);
		expect(ok).toBe(false);
	});
});
