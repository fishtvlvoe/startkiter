import { db } from "@startkiter/database";

import type { Bundle } from "./types";

export type CreateBundleInput = {
	slug: string;
	title: string;
	description?: string | null;
	priceTwd: number;
	status: "draft" | "published" | "archived";
	/** 對應 `packages/course` 現有課程的 id（design.md 抽取對應表：courseIds 驗證比照 THE-TU model Bundle）。 */
	courseIds: string[];
};

export type CreateBundleResult =
	| { ok: true; bundle: Bundle }
	| { ok: false; reason: "course_not_found"; missingCourseIds: string[] };

type BundleRow = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	priceTwd: number;
	status: string;
	courses: { courseId: string }[];
};

function toBundle(row: BundleRow): Bundle {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description,
		priceTwd: row.priceTwd,
		status: row.status as Bundle["status"],
		courseIds: row.courses.map((course) => course.courseId),
	};
}

/**
 * 建立 Bundle：courseIds 必須全部對應既有 Course，否則整筆拒絕寫入（不留下部分寫入的紀錄）。
 * 邏輯比照 Phase 1 `packages/database/src/bundle/bundle.test.ts` 的
 * `createBundleWithCourses`（該函式僅供 Phase 1 紅燈測試使用），這裡是正式版本。
 */
export async function createBundle(input: CreateBundleInput): Promise<CreateBundleResult> {
	const foundCourses = await db.course.findMany({
		where: { id: { in: input.courseIds } },
		select: { id: true },
	});
	const foundCourseIds = new Set(foundCourses.map((course) => course.id));
	const missingCourseIds = input.courseIds.filter((courseId) => !foundCourseIds.has(courseId));

	if (missingCourseIds.length > 0) {
		return { ok: false, reason: "course_not_found", missingCourseIds };
	}

	const created = await db.$transaction(async (tx) => {
		const bundle = await tx.bundle.create({
			data: {
				slug: input.slug,
				title: input.title,
				description: input.description ?? null,
				priceTwd: input.priceTwd,
				status: input.status,
			},
		});

		await tx.bundleCourse.createMany({
			data: input.courseIds.map((courseId, index) => ({
				bundleId: bundle.id,
				courseId,
				order: index,
			})),
		});

		return bundle;
	});

	return {
		ok: true,
		bundle: toBundle({
			...created,
			courses: input.courseIds.map((courseId) => ({ courseId })),
		}),
	};
}

/** 前台銷售頁 / `GET /api/bundles` 用：只回傳已發布的 Bundle。未登入可存取。 */
export async function listPublishedBundles(): Promise<Bundle[]> {
	const rows = await db.bundle.findMany({
		where: { status: "published" },
		include: { courses: { orderBy: { order: "asc" } } },
		orderBy: { createdAt: "desc" },
	});
	return rows.map(toBundle);
}

/**
 * 公開 bundle 銷售頁（`/bundles/[slug]`，Phase 2 尚未實作該頁面，屬於 tasks.md 7.2）用的查詢邏輯：
 * 只有 status="published" 才視為「找得到」，draft／archived／不存在皆回傳 null，
 * 頁面拿到 null 時呼叫 `notFound()` 即對應 Requirement「Draft bundle is not publicly visible」的 404。
 */
export async function getBundleBySlug(slug: string): Promise<Bundle | null> {
	const row = await db.bundle.findUnique({
		where: { slug },
		include: { courses: { orderBy: { order: "asc" } } },
	});
	if (!row || row.status !== "published") {
		return null;
	}
	return toBundle(row);
}

// ponytail: 原本這裡還有一個 `getBundleById`（operator 後台編輯用，任何 status 都查得到）。
// 拿掉了——`PUT /api/bundles/:id` 不在 tasks.md 5.2 這輪範圍內，沒有呼叫端會用到它，先不加。
// 之後做 operator 編輯頁（tasks.md 7.1 之後）需要時，照 `getBundleBySlug` 的寫法補一個
// 不過濾 status 的版本即可。
