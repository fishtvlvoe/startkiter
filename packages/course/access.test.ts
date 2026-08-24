import { describe, expect, it, vi } from "vitest";
import { MVP_SKU } from "@startkiter/payments/constants";

import {
	type BundleCourseAccessReader,
	canAccessCourse,
	canAccessCourseId,
	type CourseAccessReader,
} from "./access";

function readerWith(rows: { sku: string; courseAccess: boolean }[]): CourseAccessReader {
	return {
		findOrdersForUser: async () => rows,
	};
}

function bundleReaderWith(args: {
	grantedSkus: string[];
	bundleCourseIdsBySku: Record<string, string[]>;
	hasActiveSubscription?: boolean;
	hasRedeemedInvite?: boolean;
}): BundleCourseAccessReader {
	return {
		findGrantedSkusForUser: async () => args.grantedSkus,
		findBundleCourseIds: async (sku) => args.bundleCourseIdsBySku[sku] ?? null,
		hasActiveSubscription: async () => args.hasActiveSubscription ?? false,
		hasRedeemedInvite: vi.fn(async () => args.hasRedeemedInvite ?? false),
	} as BundleCourseAccessReader;
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

describe("canAccessCourseId (Requirement: Bundle purchase grants access to all included courses)", () => {
	it("preserves the platform-wide MVP entitlement for any course", async () => {
		const reader = bundleReaderWith({
			grantedSkus: [MVP_SKU],
			bundleCourseIdsBySku: {},
		});

		await expect(canAccessCourseId("user_mvp_buyer", "course_from_any_bundle", reader)).resolves.toBe(
			true,
		);
	});

	it("does not restore a refunded MVP entitlement when courseAccess clears its sku", async () => {
		const reader = bundleReaderWith({ grantedSkus: [], bundleCourseIdsBySku: {} });

		await expect(canAccessCourseId("user_refunded_mvp", "course_from_any_bundle", reader)).resolves.toBe(
			false,
		);
	});

	it("grants access to a course when the buyer's granted sku is a bundle containing that courseId", async () => {
		const reader = bundleReaderWith({
			grantedSkus: ["bundle_combo_a"],
			bundleCourseIdsBySku: { bundle_combo_a: ["course_lesson_01", "course_lesson_02"] },
		});

		await expect(canAccessCourseId("user_bundle_buyer", "course_lesson_01", reader)).resolves.toBe(
			true,
		);
		await expect(canAccessCourseId("user_bundle_buyer", "course_lesson_02", reader)).resolves.toBe(
			true,
		);
	});

	it("denies access to a course not included in any of the buyer's granted bundles", async () => {
		const reader = bundleReaderWith({
			grantedSkus: ["bundle_combo_a"],
			bundleCourseIdsBySku: { bundle_combo_a: ["course_lesson_01"] },
		});

		await expect(canAccessCourseId("user_bundle_buyer", "course_lesson_99", reader)).resolves.toBe(
			false,
		);
	});

	it("denies access when the buyer has no granted skus (e.g. after refund clears courseAccess)", async () => {
		const reader = bundleReaderWith({ grantedSkus: [], bundleCourseIdsBySku: {} });

		await expect(canAccessCourseId("user_refunded", "course_lesson_01", reader)).resolves.toBe(
			false,
		);
	});

	it("denies when userId or courseId is empty", async () => {
		const reader = bundleReaderWith({
			grantedSkus: ["bundle_combo_a"],
			bundleCourseIdsBySku: { bundle_combo_a: ["course_lesson_01"] },
		});

		await expect(canAccessCourseId("", "course_lesson_01", reader)).resolves.toBe(false);
		await expect(canAccessCourseId("user_bundle_buyer", "", reader)).resolves.toBe(false);
	});

	it("allows a buyer with an active subscription for the requested course", async () => {
		const reader = bundleReaderWith({
			grantedSkus: [],
			bundleCourseIdsBySku: {},
			hasActiveSubscription: true,
		});

		await expect(canAccessCourseId("user_subscriber", "course-a", reader)).resolves.toBe(true);
	});

	it("does not allow a canceled subscription without another entitlement", async () => {
		const reader = bundleReaderWith({
			grantedSkus: [],
			bundleCourseIdsBySku: {},
			hasActiveSubscription: false,
		});

		await expect(canAccessCourseId("user_canceled", "course-a", reader)).resolves.toBe(false);
	});

	it("keeps one-time and subscription entitlements composable", async () => {
		const reader = bundleReaderWith({
			grantedSkus: [MVP_SKU],
			bundleCourseIdsBySku: {},
			hasActiveSubscription: true,
		});

		await expect(canAccessCourseId("user_both", "course-a", reader)).resolves.toBe(true);
	});

	it("allows a learner with a redeemed invite for the requested course", async () => {
		const reader = bundleReaderWith({
			grantedSkus: [],
			bundleCourseIdsBySku: {},
			hasRedeemedInvite: true,
		});

		await expect(canAccessCourseId("user_invited", "course-a", reader)).resolves.toBe(true);
		expect(reader.hasRedeemedInvite).toHaveBeenCalledWith("user_invited", "course-a");
	});

	it("denies a learner without any redeemed invite or other entitlement", async () => {
		const reader = bundleReaderWith({
			grantedSkus: [],
			bundleCourseIdsBySku: {},
			hasRedeemedInvite: false,
		});

		await expect(canAccessCourseId("user_not_invited", "course-a", reader)).resolves.toBe(false);
	});
});
