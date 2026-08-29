import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("next/headers", () => ({
	headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({
	notFound: () => {
		throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		lesson: {
			findUnique: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/course-access", () => ({
	userCanAccessCourseId: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/course-instructor-access", () => ({
	canManageCourse: vi.fn(async () => false),
}));

import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { buildLessonToolEmbedPath } from "@startkiter/platform/src/lesson-tool/embed-path";
import { signLessonToolToken } from "@startkiter/platform/src/lesson-tool/token";

import LessonToolPage from "./page";

const TOOL_URL = "https://tools.example.com/whiteboard";
const ENCODED_ORIGIN = Buffer.from("https://tools.example.com", "utf8").toString("base64url");
const learnerSession = {
	session: { id: "session-1", userId: "user-1" },
	user: { id: "user-1", email: "learner@example.com" },
};

function pageProps(overrides?: { token?: string; encodedOrigin?: string }) {
	const token = overrides?.token ?? signLessonToolToken("lesson-1", "user-1");
	return {
		params: Promise.resolve({
			lessonId: "lesson-1",
			encodedOrigin: overrides?.encodedOrigin ?? ENCODED_ORIGIN,
		}),
		searchParams: Promise.resolve({ token }),
	};
}

describe("GET /lesson-tool/[lessonId]/[encodedOrigin] (Requirement: New-tab entry page re-validates course access on every load)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.BETTER_AUTH_SECRET = "test-lesson-tool-secret";
		vi.useRealTimers();
		vi.mocked(auth.api.getSession).mockResolvedValue(learnerSession as never);
		vi.mocked(userCanAccessCourseId).mockResolvedValue(true);
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			id: "lesson-1",
			toolUrl: TOOL_URL,
			toolTitle: "白板練習",
			chapter: { courseId: "course-1" },
		} as never);
	});

	it("renders a sandboxed iframe when the token is valid and the user currently has course access", async () => {
		const element = await LessonToolPage(pageProps());
		const html = renderToStaticMarkup(element);

		expect(html).toContain("<iframe");
		expect(html).toContain('sandbox="allow-scripts allow-forms allow-popups allow-downloads"');
		expect(html).toContain(TOOL_URL);
		expect(html).toContain("白板練習");
		expect(userCanAccessCourseId).toHaveBeenCalledWith("user-1", "course-1");
	});

	it("returns 404 when course access has been revoked after the link was issued", async () => {
		vi.mocked(userCanAccessCourseId).mockResolvedValue(false);

		await expect(LessonToolPage(pageProps())).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
	});

	it("refuses to load the tool when the token is tampered or expired", async () => {
		const valid = signLessonToolToken("lesson-1", "user-1");
		const [payload, signature] = valid.split(".");
		const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
		parsed.userId = "attacker";
		const tampered = `${Buffer.from(JSON.stringify(parsed), "utf8").toString("base64url")}.${signature}`;

		const tamperedElement = await LessonToolPage(pageProps({ token: tampered }));
		const tamperedHtml = renderToStaticMarkup(tamperedElement);
		expect(tamperedHtml).toContain("工具目前無法使用，請重新整理頁面");
		expect(tamperedHtml).not.toContain("<iframe");

		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
		const expiredToken = signLessonToolToken("lesson-1", "user-1");
		vi.setSystemTime(new Date("2026-01-01T02:00:01.000Z"));
		const expiredElement = await LessonToolPage(pageProps({ token: expiredToken }));
		const expiredHtml = renderToStaticMarkup(expiredElement);
		expect(expiredHtml).toContain("工具目前無法使用，請重新整理頁面");
		expect(expiredHtml).not.toContain("<iframe");
		vi.useRealTimers();
	});

	it("does not embed the tool when the stored URL currently resolves to a private address", async () => {
		vi.mocked(db.lesson.findUnique).mockResolvedValue({
			id: "lesson-1",
			toolUrl: "http://127.0.0.1/admin",
			toolTitle: "內網",
			chapter: { courseId: "course-1" },
		} as never);

		const element = await LessonToolPage(pageProps());
		const html = renderToStaticMarkup(element);

		expect(html).not.toContain("<iframe");
		expect(html).toContain("工具目前無法使用，請重新整理頁面");
	});

	it("refuses to issue a token when assembling a proxy path for a private URL", () => {
		expect(
			buildLessonToolEmbedPath({
				lessonId: "lesson-1",
				userId: "user-1",
				toolUrl: "http://10.1.2.3/internal",
			}),
		).toBeNull();
	});
});
