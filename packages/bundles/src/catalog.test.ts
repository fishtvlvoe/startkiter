import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import {
	createBundle,
	deleteBundle,
	getBundleById,
	getBundleBySlug,
	listAllBundles,
	listPublishedBundles,
	updateBundle,
} from "./catalog";

/**
 * `getBundleBySlug` 是公開 bundle 銷售頁（tasks.md 7.2，本輪不做 React 頁面）之後會直接呼叫的查詢邏輯：
 * 回傳非 null＝頁面回 200，回傳 null＝頁面呼叫 notFound() 回 404。
 * 這裡驗證的是這條查詢邏輯本身的行為契約（Requirement: Courses can be grouped into a priced bundle）。
 */
describe.sequential("packages/bundles catalog", () => {
	const createdCourseIds: string[] = [];
	const createdBundleIds: string[] = [];

	async function createTestCourse(title: string) {
		const course = await db.course.create({
			data: { slug: `catalog-test-course-${randomUUID()}`, title },
		});
		createdCourseIds.push(course.id);
		return course;
	}

	afterEach(async () => {
		for (const bundleId of createdBundleIds.splice(0)) {
			try {
				await db.bundle.delete({ where: { id: bundleId } });
			} catch {
				// 已被拒絕寫入的情況這裡刪不到是預期的，忽略即可。
			}
		}
		for (const courseId of createdCourseIds.splice(0)) {
			try {
				await db.course.delete({ where: { id: courseId } });
			} catch {
				// ignore cleanup errors
			}
		}
	});

	afterAll(async () => {
		await db.$disconnect();
	});

	it("Operator creates a published bundle -> public page lookup by slug succeeds (Scenario: Operator creates a published bundle)", async () => {
		const courseA = await createTestCourse("Catalog 測試課程 A");
		const courseB = await createTestCourse("Catalog 測試課程 B");
		const slug = `catalog-bundle-${randomUUID()}`;

		const result = await createBundle({
			slug,
			title: "測試綁定包",
			priceTwd: 5000,
			status: "published",
			courseIds: [courseA.id, courseB.id],
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		createdBundleIds.push(result.bundle.id);

		const found = await getBundleBySlug(slug);
		expect(found).not.toBeNull();
		expect(found?.slug).toBe(slug);
		expect(found?.status).toBe("published");
		expect(found?.courseIds).toEqual([courseA.id, courseB.id]);
	});

	it("Bundle referencing a nonexistent course is rejected with HTTP-400-equivalent result and nothing is written", async () => {
		const courseA = await createTestCourse("Catalog 測試課程 C");
		const missingCourseId = `missing-course-${randomUUID()}`;
		const slug = `catalog-bundle-rejected-${randomUUID()}`;

		const result = await createBundle({
			slug,
			title: "含不存在課程的綁定包",
			priceTwd: 3000,
			status: "published",
			courseIds: [courseA.id, missingCourseId],
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe("course_not_found");
		expect(result.missingCourseIds).toEqual([missingCourseId]);

		const found = await db.bundle.findUnique({ where: { slug } });
		expect(found).toBeNull();
	});

	it("Draft bundle is not publicly visible (Scenario: Draft bundle is not publicly visible)", async () => {
		const course = await createTestCourse("Catalog 測試課程 D");
		const slug = `catalog-bundle-draft-${randomUUID()}`;

		const result = await createBundle({
			slug,
			title: "草稿綁定包",
			priceTwd: 1000,
			status: "draft",
			courseIds: [course.id],
		});
		expect(result.ok).toBe(true);
		if (result.ok) createdBundleIds.push(result.bundle.id);

		const found = await getBundleBySlug(slug);
		expect(found).toBeNull();
	});

	it("getBundleBySlug returns null for a slug that does not exist at all", async () => {
		const found = await getBundleBySlug(`nonexistent-bundle-${randomUUID()}`);
		expect(found).toBeNull();
	});

	it("listPublishedBundles excludes draft bundles (Requirement: Bundle listing API returns published bundles only)", async () => {
		const course = await createTestCourse("Catalog 測試課程 E");

		const draftResult = await createBundle({
			slug: `catalog-list-draft-${randomUUID()}`,
			title: "草稿綁定包",
			priceTwd: 1000,
			status: "draft",
			courseIds: [course.id],
		});
		expect(draftResult.ok).toBe(true);
		if (draftResult.ok) createdBundleIds.push(draftResult.bundle.id);

		const publishedResult = await createBundle({
			slug: `catalog-list-published-${randomUUID()}`,
			title: "已發布綁定包",
			priceTwd: 2000,
			status: "published",
			courseIds: [course.id],
		});
		expect(publishedResult.ok).toBe(true);
		if (publishedResult.ok) createdBundleIds.push(publishedResult.bundle.id);

		const published = await listPublishedBundles();
		const publishedIds = published.map((bundle) => bundle.id);

		if (draftResult.ok) expect(publishedIds).not.toContain(draftResult.bundle.id);
		if (publishedResult.ok) expect(publishedIds).toContain(publishedResult.bundle.id);
	});

	it("listAllBundles includes draft bundles (operator 後台列表用，跟 listPublishedBundles 對照)", async () => {
		const course = await createTestCourse("Catalog 測試課程 F");
		const draftResult = await createBundle({
			slug: `catalog-admin-draft-${randomUUID()}`,
			title: "只有 operator 看得到的草稿",
			priceTwd: 1000,
			status: "draft",
			courseIds: [course.id],
		});
		expect(draftResult.ok).toBe(true);
		if (draftResult.ok) createdBundleIds.push(draftResult.bundle.id);

		const all = await listAllBundles();
		const allIds = all.map((bundle) => bundle.id);
		if (draftResult.ok) expect(allIds).toContain(draftResult.bundle.id);
	});

	it("getBundleById finds a draft bundle by id (public getBundleBySlug would return null for the same bundle)", async () => {
		const course = await createTestCourse("Catalog 測試課程 G");
		const result = await createBundle({
			slug: `catalog-getbyid-${randomUUID()}`,
			title: "編輯用草稿",
			priceTwd: 1000,
			status: "draft",
			courseIds: [course.id],
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		createdBundleIds.push(result.bundle.id);

		const found = await getBundleById(result.bundle.id);
		expect(found?.id).toBe(result.bundle.id);
		expect(found?.status).toBe("draft");

		const publicLookup = await getBundleBySlug(result.bundle.slug);
		expect(publicLookup).toBeNull();
	});

	it("getBundleById returns null for a nonexistent id", async () => {
		const found = await getBundleById(`nonexistent-bundle-${randomUUID()}`);
		expect(found).toBeNull();
	});

	it("updateBundle replaces title/price/status/courseIds and returns not_found for a missing id", async () => {
		const courseA = await createTestCourse("Catalog 測試課程 H");
		const courseB = await createTestCourse("Catalog 測試課程 I");
		const created = await createBundle({
			slug: `catalog-update-${randomUUID()}`,
			title: "更新前標題",
			priceTwd: 1000,
			status: "draft",
			courseIds: [courseA.id],
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		createdBundleIds.push(created.bundle.id);

		const updated = await updateBundle(created.bundle.id, {
			slug: created.bundle.slug,
			title: "更新後標題",
			priceTwd: 2000,
			status: "published",
			courseIds: [courseA.id, courseB.id],
		});
		expect(updated.ok).toBe(true);
		if (!updated.ok) return;
		expect(updated.bundle.title).toBe("更新後標題");
		expect(updated.bundle.priceTwd).toBe(2000);
		expect(updated.bundle.status).toBe("published");
		expect(updated.bundle.courseIds).toEqual([courseA.id, courseB.id]);

		const missing = await updateBundle(`nonexistent-bundle-${randomUUID()}`, {
			slug: "irrelevant",
			title: "irrelevant",
			priceTwd: 1,
			status: "draft",
			courseIds: [courseA.id],
		});
		expect(missing.ok).toBe(false);
		if (missing.ok) return;
		expect(missing.reason).toBe("not_found");
	});

	it("updateBundle rejects a nonexistent courseId and leaves the bundle unchanged", async () => {
		const course = await createTestCourse("Catalog 測試課程 J");
		const created = await createBundle({
			slug: `catalog-update-reject-${randomUUID()}`,
			title: "維持不變的標題",
			priceTwd: 1000,
			status: "draft",
			courseIds: [course.id],
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;
		createdBundleIds.push(created.bundle.id);

		const missingCourseId = `missing-course-${randomUUID()}`;
		const result = await updateBundle(created.bundle.id, {
			slug: created.bundle.slug,
			title: "應該不會生效",
			priceTwd: 9999,
			status: "published",
			courseIds: [missingCourseId],
		});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe("course_not_found");

		const unchanged = await getBundleById(created.bundle.id);
		expect(unchanged?.title).toBe("維持不變的標題");
		expect(unchanged?.courseIds).toEqual([course.id]);
	});

	it("deleteBundle removes the bundle and cascades to BundleCourse rows, returns not_found for a missing id", async () => {
		const course = await createTestCourse("Catalog 測試課程 K");
		const created = await createBundle({
			slug: `catalog-delete-${randomUUID()}`,
			title: "待刪除",
			priceTwd: 1000,
			status: "draft",
			courseIds: [course.id],
		});
		expect(created.ok).toBe(true);
		if (!created.ok) return;

		const result = await deleteBundle(created.bundle.id);
		expect(result.ok).toBe(true);

		const found = await getBundleById(created.bundle.id);
		expect(found).toBeNull();
		const bundleCourseRows = await db.bundleCourse.findMany({ where: { bundleId: created.bundle.id } });
		expect(bundleCourseRows).toHaveLength(0);

		const missing = await deleteBundle(created.bundle.id);
		expect(missing.ok).toBe(false);
		if (missing.ok) return;
		expect(missing.reason).toBe("not_found");
	});
});
