import { randomUUID } from "node:crypto";

import { db } from "@startkiter/database";
import { afterAll, afterEach, describe, expect, it } from "vitest";

import { createBundle, getBundleBySlug, listPublishedBundles } from "./catalog";

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
});
