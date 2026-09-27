import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(),
}));

vi.mock("../../../../../lib/course-access", () => ({
	userHasCourseAccess: vi.fn(),
	userHasKitClaimAccess: vi.fn(async () => false),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		course: {
			findFirst: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/published-content-cache", () => ({
	getCachedPublishedCurriculum: vi.fn(async () => []),
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

import { getSession } from "@auth/lib/server";
import { db } from "@startkiter/database";
import { userHasCourseAccess } from "../../../../../lib/course-access";
import CoursePage from "./page";

describe("LINE community join control on course page (Task 5.1 & 5.2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSession).mockResolvedValue({
			user: { id: "user-1", email: "user@example.com" },
			session: { id: "sess-1" },
		} as never);
	});

	it("Fixture 1: 已購買 + https，渲染可點擊的「加入 LINE 學習群」連結", async () => {
		vi.mocked(userHasCourseAccess).mockResolvedValue(true);
		vi.mocked(db.course.findFirst).mockResolvedValue({
			id: "course-1",
			lineInviteUrl: "https://line.me/ti/g/test-group",
			coverImageUrl: null,
		} as never);

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		expect(html).toContain("加入 LINE 學習群");
		expect(html).toContain('href="https://line.me/ti/g/test-group"');
		expect(html).toContain('data-testid="line-invite-link"');
	});

	it("Fixture 2: 已購買 + 空值，不出現加入 LINE 學習群連結", async () => {
		vi.mocked(userHasCourseAccess).mockResolvedValue(true);
		vi.mocked(db.course.findFirst).mockResolvedValue({
			id: "course-1",
			lineInviteUrl: null,
			coverImageUrl: null,
		} as never);

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		expect(html).not.toContain("加入 LINE 學習群");
		expect(html).not.toContain('data-testid="line-invite-link"');
	});

	it("Fixture 3: 已購買 + 非 https，不出現加入 LINE 學習群連結", async () => {
		vi.mocked(userHasCourseAccess).mockResolvedValue(true);
		vi.mocked(db.course.findFirst).mockResolvedValue({
			id: "course-1",
			lineInviteUrl: "http://line.me/ti/g/insecure",
			coverImageUrl: null,
		} as never);

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		expect(html).not.toContain("加入 LINE 學習群");
		expect(html).not.toContain('data-testid="line-invite-link"');
	});

	it("Fixture 4: 未購買 + https，不出現加入 LINE 學習群連結", async () => {
		vi.mocked(userHasCourseAccess).mockResolvedValue(false);
		vi.mocked(db.course.findFirst).mockResolvedValue({
			id: "course-1",
			lineInviteUrl: "https://line.me/ti/g/test-group",
			coverImageUrl: null,
		} as never);

		const jsx = await CoursePage();
		const html = renderToStaticMarkup(jsx);

		expect(html).not.toContain("加入 LINE 學習群");
		expect(html).not.toContain('data-testid="line-invite-link"');
	});
});
