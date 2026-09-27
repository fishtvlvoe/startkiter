import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(),
}));

vi.mock("@startkiter/permissions", () => ({
	isOperator: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/course-instructor-access", () => ({
	hasAnyCourseInstructorAssignment: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/published-content-cache", () => ({
	getCachedPublishedCurriculum: vi.fn(async () => [
		{
			id: "chap-1",
			title: "第一章",
			order: 0,
			lessons: [
				{
					id: "lesson-preview-1",
					title: "預覽單元一",
					slug: "lesson-prev-1",
					order: 0,
					status: "PUBLISHED",
					description: "預覽單元說明",
				},
			],
		},
	]),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));

vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn(async () => (key: string) => `[t:${key}]`),
}));

import { getSession } from "@auth/lib/server";
import { hasAnyCourseInstructorAssignment } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { isOperator } from "@startkiter/permissions";
import { redirect } from "next/navigation";
import CoursePreviewPage from "./page";

describe("CoursePreviewPage (Task 3.1)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("Fixture 2: app-user 角色直接打 /course/preview 網址被拒絕並 redirect", async () => {
		vi.mocked(getSession).mockResolvedValue({
			user: { id: "user-normal", email: "user@example.com" },
			session: { id: "sess-1" },
		} as never);
		// 非 operator 且非 instructor => app-user
		vi.mocked(isOperator).mockReturnValue(false);
		vi.mocked(hasAnyCourseInstructorAssignment).mockResolvedValue(false);

		await expect(CoursePreviewPage()).rejects.toThrow("REDIRECT:/");
		expect(redirect).toHaveBeenCalledWith("/");
	});

	it("Fixture 1: app-admin 開啟看到無選單 + 單一返回鈕 + 真實課綱內容", async () => {
		vi.mocked(getSession).mockResolvedValue({
			user: { id: "operator-admin", email: "admin@example.com" },
			session: { id: "sess-admin" },
		} as never);
		// 是 operator => app-admin
		vi.mocked(isOperator).mockReturnValue(true);
		vi.mocked(hasAnyCourseInstructorAssignment).mockResolvedValue(false);

		const jsx = await CoursePreviewPage();
		const html = renderToStaticMarkup(jsx);

		// 1. 包含單一返回課程管理員按鈕，href 指向 /admin/course
		expect(html).toContain('href="/admin/course"');
		expect(html).toContain("返回課程管理員");

		// 2. 顯示與 /course 相同的已發布課綱內容
		expect(html).toContain("預覽單元一");
		expect(html).toContain('href="/course/lesson-preview-1"');

		// 3. 不渲染任何選單（無導覽列/側邊欄選單）
		expect(html).not.toContain('data-testid="navbar"');
		expect(html).not.toContain('data-testid="sidebar-nav"');
	});
});
