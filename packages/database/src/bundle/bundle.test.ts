import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it } from "vitest";

import { db } from "../../prisma/client";

/**
 * Phase 1 紅燈測試專用的最小可用建立函式。
 * 正式的 `packages/bundles/src/catalog.ts` 建立/查詢邏輯屬於 Phase 2（tasks.md 5.1），
 * 這裡只驗證 Bundle/BundleCourse 資料表本身的行為：courseIds 必須全部對應既有 Course，
 * 否則整筆拒絕寫入（不留下部分寫入的 Bundle 或 BundleCourse 記錄）。
 */
async function createBundleWithCourses(input: {
	slug: string;
	title: string;
	priceTwd: number;
	status: "draft" | "published" | "archived";
	courseIds: string[];
}): Promise<{ ok: true; bundleId: string } | { ok: false; reason: "course_not_found" }> {
	const foundCourses = await db.course.findMany({
		where: { id: { in: input.courseIds } },
		select: { id: true },
	});
	const foundCourseIds = new Set(foundCourses.map((course) => course.id));
	const hasMissingCourse = input.courseIds.some((courseId) => !foundCourseIds.has(courseId));

	if (hasMissingCourse) {
		return { ok: false, reason: "course_not_found" };
	}

	const bundle = await db.$transaction(async (tx) => {
		const created = await tx.bundle.create({
			data: {
				slug: input.slug,
				title: input.title,
				priceTwd: input.priceTwd,
				status: input.status,
			},
		});

		await tx.bundleCourse.createMany({
			data: input.courseIds.map((courseId, index) => ({
				bundleId: created.id,
				courseId,
				order: index,
			})),
		});

		return created;
	});

	return { ok: true, bundleId: bundle.id };
}

describe.sequential("Bundle/BundleCourse database behavior", () => {
	const createdCourseIds: string[] = [];
	const createdBundleIds: string[] = [];

	async function createTestCourse(title: string) {
		const course = await db.course.create({
			data: {
				slug: `bundle-test-course-${randomUUID()}`,
				title,
			},
		});
		createdCourseIds.push(course.id);
		return course;
	}

	afterEach(async () => {
		for (const bundleId of createdBundleIds.splice(0)) {
			try {
				// BundleCourse 有 onDelete: Cascade，刪 Bundle 會一併清掉關聯列。
				await db.bundle.delete({ where: { id: bundleId } });
			} catch {
				// 已被測試邏輯本身拒絕寫入的情況，這裡刪不到是預期的，忽略即可。
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

	it("stores a published bundle with valid courseIds and writes matching BundleCourse rows (Requirement: Courses can be grouped into a priced bundle)", async () => {
		const courseA = await createTestCourse("Bundle 測試課程 A");
		const courseB = await createTestCourse("Bundle 測試課程 B");
		const slug = `test-bundle-${randomUUID()}`;

		const result = await createBundleWithCourses({
			slug,
			title: "測試綁定包",
			priceTwd: 5000,
			status: "published",
			courseIds: [courseA.id, courseB.id],
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		createdBundleIds.push(result.bundleId);

		const found = await db.bundle.findUnique({
			where: { id: result.bundleId },
			include: { courses: { orderBy: { order: "asc" } } },
		});

		expect(found).not.toBeNull();
		expect(found?.slug).toBe(slug);
		expect(found?.status).toBe("published");
		expect(found?.courses.map((row) => row.courseId)).toEqual([courseA.id, courseB.id]);
	});

	it("rejects and does not write anything when courseIds contains a nonexistent course id (Requirement: Courses can be grouped into a priced bundle / Bundle referencing a nonexistent course is rejected)", async () => {
		const courseA = await createTestCourse("Bundle 測試課程 C");
		const missingCourseId = `missing-course-${randomUUID()}`;
		const slug = `test-bundle-rejected-${randomUUID()}`;

		const result = await createBundleWithCourses({
			slug,
			title: "含不存在課程的綁定包",
			priceTwd: 3000,
			status: "published",
			courseIds: [courseA.id, missingCourseId],
		});

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe("course_not_found");

		const found = await db.bundle.findUnique({ where: { slug } });
		expect(found).toBeNull();

		const bundleCourseRows = await db.bundleCourse.findMany({ where: { courseId: courseA.id } });
		expect(bundleCourseRows).toHaveLength(0);
	});

	it("excludes draft bundles from a published-only query (Requirement: Bundle listing API returns published bundles only)", async () => {
		const course = await createTestCourse("Bundle 測試課程 D");

		const draftSlug = `test-bundle-draft-${randomUUID()}`;
		const draftResult = await createBundleWithCourses({
			slug: draftSlug,
			title: "草稿綁定包",
			priceTwd: 1000,
			status: "draft",
			courseIds: [course.id],
		});
		expect(draftResult.ok).toBe(true);
		if (draftResult.ok) createdBundleIds.push(draftResult.bundleId);

		const publishedSlug = `test-bundle-published-${randomUUID()}`;
		const publishedResult = await createBundleWithCourses({
			slug: publishedSlug,
			title: "已發布綁定包",
			priceTwd: 2000,
			status: "published",
			courseIds: [course.id],
		});
		expect(publishedResult.ok).toBe(true);
		if (publishedResult.ok) createdBundleIds.push(publishedResult.bundleId);

		const publishedOnly = await db.bundle.findMany({ where: { status: "published" } });
		const publishedOnlyIds = publishedOnly.map((bundle) => bundle.id);

		if (draftResult.ok) {
			expect(publishedOnlyIds).not.toContain(draftResult.bundleId);
		}
		if (publishedResult.ok) {
			expect(publishedOnlyIds).toContain(publishedResult.bundleId);
		}
	});
});
