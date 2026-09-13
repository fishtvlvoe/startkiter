import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const callTimestamps: Record<string, number> = {};

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
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));

vi.mock("next-intl/server", () => ({
	getTranslations: vi.fn(async () => (key: string) => `[t:${key}]`),
}));

vi.mock("./course-review-panel", () => ({
	CourseReviewPanel: ({ courseId }: { courseId: string }) => (
		<div data-testid="course-review-panel">Review for {courseId}</div>
	),
}));

vi.mock("@startkiter/course", () => ({
	listLessons: vi.fn(() => [
		{ id: "lesson-1", order: 0, title: "Lesson 1", description: "Desc 1" },
		{ id: "lesson-2", order: 1, title: "Lesson 2", description: "Desc 2" },
	]),
	getLesson: vi.fn((id: string) => ({
		id,
		order: 0,
		title: `Lesson ${id}`,
		description: `Desc ${id}`,
	})),
}));

import { getSession } from "@auth/lib/server";
import { db } from "@startkiter/database";
import { redirect } from "next/navigation";
import { userHasCourseAccess } from "../../../../../lib/course-access";
import CoursePage from "./page";

const mockSession = {
	user: { id: "user-buyer-1", name: "Buyer 1", email: "buyer@example.com" },
	session: { id: "session-buyer-1" },
};

describe("CoursePage (6.1 & 6.2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		for (const key of Object.keys(callTimestamps)) {
			delete callTimestamps[key];
		}
		vi.mocked(getSession).mockResolvedValue(mockSession as never);
	});

	it("6.1: 驗證 userHasCourseAccess 與 db.course.findFirst 為平行發出而非序列 await", async () => {
		const delayMs = 40;
		const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

		vi.mocked(userHasCourseAccess).mockImplementation(async () => {
			callTimestamps.courseAccess = Date.now();
			await delay(delayMs);
			return true;
		});

		vi.mocked(db.course.findFirst).mockImplementation((async () => {
			callTimestamps.findFirst = Date.now();
			await delay(delayMs);
			return { id: "course-123", coverImageUrl: "cover.jpg" } as never;
		}) as unknown as typeof db.course.findFirst);

		await CoursePage();

		expect(callTimestamps.courseAccess).toBeDefined();
		expect(callTimestamps.findFirst).toBeDefined();

		const spread = Math.abs(callTimestamps.courseAccess - callTimestamps.findFirst);

		// 若為序列（entitled ? await db.course.findFirst : null），findFirst 需等 courseAccess 40ms resolve 後才呼叫，spread >= 40ms。
		// 若為 Promise.all 平行發出，兩者在同一個 tick（< 25ms）內呼叫。
		expect(spread).toBeLessThan(25);
	});

	it("6.2 (情境 1): 未登入使用者被 redirect 至 /login", async () => {
		vi.mocked(getSession).mockResolvedValue(null as never);

		await expect(CoursePage()).rejects.toThrow("REDIRECT:/login");
		expect(redirect).toHaveBeenCalledWith("/login");
	});

	it("6.2 (情境 2): 無權限使用者看到 lockedNotice、checkout 連結，無封面圖與評價面板", async () => {
		vi.mocked(userHasCourseAccess).mockResolvedValue(false);
		vi.mocked(db.course.findFirst).mockResolvedValue({
			id: "course-123",
			coverImageUrl: "cover.jpg",
		} as never);

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		// 無權限的文案與鎖定提示
		expect(html).toContain("[t:lockedDescription]");
		expect(html).toContain("[t:lockedNotice]");
		expect(html).toContain('href="/checkout"');
		expect(html).toContain("[t:lockedPlayback]");

		// 不應顯示封面圖或評價面板
		expect(html).not.toContain('data-testid="course-cover-image"');
		expect(html).not.toContain('data-testid="course-review-panel"');
	});

	it("6.2 (情境 3): 有權限使用者看到課程內容、封面圖、第一堂課連結與評價面板", async () => {
		vi.mocked(userHasCourseAccess).mockResolvedValue(true);
		vi.mocked(db.course.findFirst).mockResolvedValue({
			id: "course-123",
			coverImageUrl: "cover.jpg",
		} as never);

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		// 有權限的文案與課綱內容
		expect(html).toContain("[t:entitledDescription]");
		expect(html).not.toContain("[t:lockedNotice]");
		expect(html).toContain('href="/course/lesson-1"');
		expect(html).toContain('data-testid="course-cover-image"');
		expect(html).toContain('data-testid="course-review-panel"');
		expect(html).toContain("Review for course-123");
	});

	it("6.2 (情境 4): db.course.findFirst reject 時，無權限使用者仍然看到 lockedNotice，不會整頁噴錯", async () => {
		vi.mocked(userHasCourseAccess).mockResolvedValue(false);
		vi.mocked(db.course.findFirst).mockRejectedValue(new Error("Database transient error"));

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		// 無權限使用者依舊正常渲染鎖定頁面，不噴 500
		expect(html).toContain("[t:lockedDescription]");
		expect(html).toContain("[t:lockedNotice]");
		expect(html).toContain('href="/checkout"');
		expect(html).toContain("[t:lockedPlayback]");
		expect(html).not.toContain('data-testid="course-cover-image"');
		expect(html).not.toContain('data-testid="course-review-panel"');
	});
});
