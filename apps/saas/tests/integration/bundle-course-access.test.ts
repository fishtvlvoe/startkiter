import { randomUUID } from "node:crypto";

import { canAccessCourseId, type BundleCourseAccessReader } from "@startkiter/course";
import { db } from "@startkiter/database";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { createBundle } from "@startkiter/bundles";

/**
 * Requirement: Bundle purchase grants access to all included courses（含 Refunded bundle
 * revokes access to all its courses scenario）。
 *
 * `@startkiter/course` 只在這裡當 devDependency 用（純測試，驗證 5.1/5.3 兩個套件接得起來），
 * production 的 `packages/bundles` 代碼本身不 import `@startkiter/course`——避免建立
 * bundles → course → payments → database 的反向依賴邊，course 目前依賴 payments 依賴 database，
 * 若讓 database 或 payments 反過來依賴 course 會形成循環，bundles 是安全的落點（沒有其他套件依賴它）。
 *
 * DB-backed reader 是這裡的測試專用最小實作（比照 Phase 1 `bundle.test.ts` 的
 * `createBundleWithCourses` 慣例），之後 tasks.md 7.x 的頁面要用時，正式的 production reader
 * 會放在呼叫端（例如 `apps/saas/lib/`），形狀與這裡驗證過的一致。
 */
function createDbBundleCourseAccessReader(): BundleCourseAccessReader {
	return {
		findGrantedSkusForUser: async (userId) => {
			const rows = await db.order.findMany({
				where: { userId, courseAccess: true },
				select: { sku: true },
			});
			return rows.map((row) => row.sku);
		},
		findBundleCourseIds: async (sku) => {
			const bundle = await db.bundle.findUnique({
				where: { id: sku },
				include: { courses: true },
			});
			if (!bundle) return null;
			return bundle.courses.map((course) => course.courseId);
		},
		hasActiveSubscription: async () => false,
		hasRedeemedInvite: async () => false,
	};
}

describe.sequential("Bundle purchase -> per-course access grant/revoke (real DB)", () => {
	const createdUserIds: string[] = [];
	const createdCourseIds: string[] = [];
	const createdBundleIds: string[] = [];
	const createdOrderNos: string[] = [];

	async function createTestUser() {
		const user = await db.user.create({
			data: {
				name: "Bundle access test buyer",
				email: `bundle-access-${randomUUID()}@example.com`,
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});
		createdUserIds.push(user.id);
		return user;
	}

	async function createTestCourse(title: string) {
		const course = await db.course.create({
			data: { slug: `bundle-access-course-${randomUUID()}`, title },
		});
		createdCourseIds.push(course.id);
		return course;
	}

	afterEach(async () => {
		for (const orderNo of createdOrderNos.splice(0)) {
			try {
				await db.order.delete({ where: { orderNo } });
			} catch {
				// ignore cleanup errors
			}
		}
		for (const bundleId of createdBundleIds.splice(0)) {
			try {
				await db.bundle.delete({ where: { id: bundleId } });
			} catch {
				// ignore cleanup errors
			}
		}
		for (const courseId of createdCourseIds.splice(0)) {
			try {
				await db.course.delete({ where: { id: courseId } });
			} catch {
				// ignore cleanup errors
			}
		}
		for (const userId of createdUserIds.splice(0)) {
			try {
				await db.user.delete({ where: { id: userId } });
			} catch {
				// ignore cleanup errors
			}
		}
	});

	afterAll(async () => {
		await db.$disconnect();
	});

	it(
		"grants access to every course in a bundle once PAYUNi marks the bundle order paid " +
			"(Example: 兩堂課的 bundle 付款後兩堂都能看 — combo-a 包含 lesson-01/lesson-02)",
		async () => {
			const buyer = await createTestUser();
			const lesson01 = await createTestCourse("bundle-access lesson-01");
			const lesson02 = await createTestCourse("bundle-access lesson-02");

			const bundleResult = await createBundle({
				slug: `combo-a-${randomUUID()}`,
				title: "combo-a",
				priceTwd: 6000,
				status: "published",
				courseIds: [lesson01.id, lesson02.id],
			});
			expect(bundleResult.ok).toBe(true);
			if (!bundleResult.ok) return;
			createdBundleIds.push(bundleResult.bundle.id);

			const orderNo = `SK-BUNDLE-${randomUUID().slice(0, 12)}`;
			createdOrderNos.push(orderNo);
			// 模擬 PAYUNi 標記 bundle 訂單已付款：sku 存 bundle 自己的 id（design.md 未定義 Phase 2
			// 的 bundle 訂單識別欄位，Order 表目前也沒有 productId／bundleId 欄位——Phase 4 才會加，
			// 這裡沿用既有 sku 欄位當商品識別碼，courseAccess=true 比照既有單一課程購買的授權慣例）。
			await db.order.create({
				data: {
					orderNo,
					userId: buyer.id,
					sku: bundleResult.bundle.id,
					amount: bundleResult.bundle.priceTwd,
					currency: "TWD",
					status: "paid",
					paymentGateway: "payuni",
					gatewayTradeNo: `TRADE-${randomUUID().slice(0, 12)}`,
					courseAccess: true,
					kitClaimEligible: false,
					paidAt: new Date(),
				},
			});

			const reader = createDbBundleCourseAccessReader();

			await expect(canAccessCourseId(buyer.id, lesson01.id, reader)).resolves.toBe(true);
			await expect(canAccessCourseId(buyer.id, lesson02.id, reader)).resolves.toBe(true);

			const unrelatedCourse = await createTestCourse("bundle-access unrelated course");
			await expect(canAccessCourseId(buyer.id, unrelatedCourse.id, reader)).resolves.toBe(false);
		},
	);

	it(
		"revokes access to every course in the bundle once the bundle order is refunded " +
			"(Scenario: Refunded bundle revokes access to all its courses)",
		async () => {
			const buyer = await createTestUser();
			const lesson01 = await createTestCourse("bundle-refund lesson-01");
			const lesson02 = await createTestCourse("bundle-refund lesson-02");

			const bundleResult = await createBundle({
				slug: `combo-refund-${randomUUID()}`,
				title: "combo-refund",
				priceTwd: 7000,
				status: "published",
				courseIds: [lesson01.id, lesson02.id],
			});
			expect(bundleResult.ok).toBe(true);
			if (!bundleResult.ok) return;
			createdBundleIds.push(bundleResult.bundle.id);

			const orderNo = `SK-BUNDLE-${randomUUID().slice(0, 12)}`;
			createdOrderNos.push(orderNo);
			await db.order.create({
				data: {
					orderNo,
					userId: buyer.id,
					sku: bundleResult.bundle.id,
					amount: bundleResult.bundle.priceTwd,
					currency: "TWD",
					status: "paid",
					paymentGateway: "payuni",
					gatewayTradeNo: `TRADE-${randomUUID().slice(0, 12)}`,
					courseAccess: true,
					kitClaimEligible: false,
					paidAt: new Date(),
				},
			});

			const reader = createDbBundleCourseAccessReader();
			await expect(canAccessCourseId(buyer.id, lesson01.id, reader)).resolves.toBe(true);
			await expect(canAccessCourseId(buyer.id, lesson02.id, reader)).resolves.toBe(true);

			// 退款：更新 shape 比照 `apps/saas/lib/orders.ts` 既有的 `markOrderRefundedInDb`
			// （status→refunded、courseAccess→false），該函式對任何 sku 都通用，bundle 訂單不例外，
			// 所以 task 5.4「修改退款流程」不需要新增 bundle 專屬程式碼——既有的通用退款邏輯
			// 搭配 5.3 新增的 sku→bundle 反查即可讓存取權正確一併撤銷，這裡直接驗證這個結論。
			await db.order.update({
				where: { orderNo },
				data: { status: "refunded", courseAccess: false, kitClaimEligible: false, refundedAt: new Date() },
			});

			await expect(canAccessCourseId(buyer.id, lesson01.id, reader)).resolves.toBe(false);
			await expect(canAccessCourseId(buyer.id, lesson02.id, reader)).resolves.toBe(false);
		},
	);
});
