import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		course: {
			findFirst: vi.fn(),
		},
	},
}));

vi.mock("../../../../../lib/course-access", () => ({
	userHasCourseAccess: vi.fn(),
	userHasKitClaimAccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn(async () => (key: string) => `[t:${key}]`),
}));

vi.mock("./course-review-panel", () => ({
	CourseReviewPanel: () => null,
}));

const { mockListLessons, mockGetCachedPublishedCurriculum } = vi.hoisted(() => ({
	mockListLessons: vi.fn(),
	mockGetCachedPublishedCurriculum: vi.fn(),
}));

vi.mock("@startkiter/course", async (importOriginal) => {
	const actual = (await importOriginal()) as Record<string, unknown>;
	return {
		...actual,
		listLessons: mockListLessons,
	};
});

vi.mock("@startkiter/api/modules/course/lib/published-content-cache", () => ({
	getCachedPublishedCurriculum: mockGetCachedPublishedCurriculum,
}));

import { getSession } from "@auth/lib/server";
import { db } from "@startkiter/database";
import { userHasCourseAccess } from "../../../../../lib/course-access";
import CoursePage from "./page";

describe("CoursePage catalog source (Task 2.1 & 2.3)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSession).mockResolvedValue({
			user: { id: "user-1", email: "user@example.com" },
			session: { id: "session-1" },
		} as never);
		vi.mocked(userHasCourseAccess).mockResolvedValue(true);
		mockListLessons.mockReturnValue([
			{ id: "demo-1", title: "開站包是什麼", order: 0 },
		]);
		vi.mocked(db.course.findFirst).mockResolvedValue({
			id: "course-1",
			lineInviteUrl: null,
			coverImageUrl: null,
		} as never);
	});

	it("斷言呼叫與教室相同的 getCachedPublishedCurriculum，且不呼叫 listLessons", async () => {
		mockGetCachedPublishedCurriculum.mockResolvedValue([
			{
				id: "chap-1",
				title: "第一章",
				order: 0,
				lessons: [
					{
						id: "lesson-db-1",
						title: "真實單元一",
						slug: "lesson-real-1",
						order: 0,
						status: "PUBLISHED",
						description: "單元一說明",
					},
					{
						id: "lesson-db-2",
						title: "真實單元二",
						slug: "lesson-real-2",
						order: 1,
						status: "PUBLISHED",
						description: "單元二說明",
					},
				],
			},
		]);

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		// 必須呼叫 getCachedPublishedCurriculum
		expect(mockGetCachedPublishedCurriculum).toHaveBeenCalled();
		// 絕不能呼叫 listLessons
		expect(mockListLessons).not.toHaveBeenCalled();

		// 畫面上的連結必須包含真實資料庫單元的 id 與標題
		expect(html).toContain('href="/course/lesson-db-1"');
		expect(html).toContain("真實單元一");
		expect(html).toContain('href="/course/lesson-db-2"');
		expect(html).toContain("真實單元二");
	});

	it("當無任何已發布單元或章節時，顯示空狀態文案，且不退回靜態 demo 清單", async () => {
		mockGetCachedPublishedCurriculum.mockResolvedValue([]);

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		expect(mockGetCachedPublishedCurriculum).toHaveBeenCalled();
		expect(mockListLessons).not.toHaveBeenCalled();
		// 不應有靜態 demo 單元
		expect(html).not.toContain("開站包是什麼");
		expect(html).not.toContain("lesson-01");
	});
});
