import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/database", () => ({
	VideoProvider: {},
	db: {
		course: {
			delete: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
		},
		chapter: {
			findUnique: vi.fn(),
			count: vi.fn(),
			create: vi.fn(),
		},
		lesson: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		},
		courseInstructor: {
			findUnique: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/video-resolver", () => ({
	resolveVideoSource: vi.fn(),
}));

vi.mock("@startkiter/course", () => ({
	inspectMdxSource: vi.fn(),
}));

vi.mock("@startkiter/platform", () => ({
	getClientIp: vi.fn(),
	recordAdminAction: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { COURSE_STUDIO_ERROR_CODES } from "@startkiter/api/modules/course/errors";
import { db } from "@startkiter/database";
import { inspectMdxSource } from "@startkiter/course";
import { recordAdminAction } from "@startkiter/platform";
import { POST } from "./route";

describe("Course Studio API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { ipAddress: "203.0.113.12" },
			user: { id: "operator-01", email: "operator@example.com" },
		} as never);
		vi.mocked(inspectMdxSource).mockReturnValue({ ok: true });
		vi.mocked(db.lesson.update).mockResolvedValue({
			id: "lesson-01",
			content: "<WebContainerSandbox blockId=\"demo\" files={{}} hints={[]} />",
		} as never);
		vi.mocked(db.chapter.count).mockResolvedValue(0 as never);
		vi.mocked(db.chapter.create).mockResolvedValue({ id: "chapter-01", courseId: "course-01" } as never);
	});

	it("rejects an instructor after an assignment is removed", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { ipAddress: "203.0.113.13" },
			user: { id: "instructor-01", email: "instructor@example.com" },
		} as never);
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue(null);

		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "create_chapter",
					payload: { courseId: "course-01", title: "不應建立" },
				}),
			}),
		);

		expect(response.status).toBe(403);
		expect(db.chapter.create).not.toHaveBeenCalled();
	});

	it("allows an instructor to change an assigned course", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { ipAddress: "203.0.113.14" },
			user: { id: "instructor-01", email: "instructor@example.com" },
		} as never);
		vi.mocked(db.courseInstructor.findUnique).mockResolvedValue({ id: "assignment-01" } as never);

		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "create_chapter",
					payload: { courseId: "course-01", title: "可建立" },
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(db.chapter.create).toHaveBeenCalledWith({
			data: { courseId: "course-01", title: "可建立", order: 0 },
		});
	});

	it("rejects mixed authorization and mutation ids", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			session: { ipAddress: "203.0.113.15" },
			user: { id: "instructor-01", email: "instructor@example.com" },
		} as never);
		vi.mocked(db.courseInstructor.findUnique).mockImplementation((args) => {
			const courseId = args.where?.courseId_userId?.courseId;
			return (courseId === "course-assigned" ? { id: "assignment-01" } : null) as never;
		});
		vi.mocked(db.course.update).mockResolvedValue({ id: "course-other" } as never);

		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update_course",
					payload: { courseId: "course-assigned", id: "course-other", title: "不應修改" },
				}),
			}),
		);

		expect(response.status).toBe(403);
		expect(db.course.update).not.toHaveBeenCalled();
	});

	it("records course deletion as an operator audit action", async () => {
		vi.mocked(db.course.delete).mockResolvedValue({ id: "course-01" } as never);

		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "delete_course", payload: { id: "course-01" } }),
			}),
		);

		expect(response.status).toBe(200);
		expect(recordAdminAction).toHaveBeenCalledWith(
			"operator-01",
			"DELETE_COURSE",
			{ type: "Course", id: "course-01" },
			undefined,
			"203.0.113.12",
		);
	});

	it("records lesson deletion as an operator audit action", async () => {
		vi.mocked(db.lesson.delete).mockResolvedValue({ id: "lesson-01" } as never);

		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "delete_lesson", payload: { id: "lesson-01" } }),
			}),
		);

		expect(response.status).toBe(200);
		expect(recordAdminAction).toHaveBeenCalledWith(
			"operator-01",
			"DELETE_LESSON",
			{ type: "Lesson", id: "lesson-01" },
			undefined,
			"203.0.113.12",
		);
	});

	it("接受含 WebContainerSandbox 的合法 MDX 並持久化", async () => {
		const content = '<WebContainerSandbox blockId="demo" files={{}} hints={[]} />';
		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update_lesson",
					payload: { id: "lesson-01", title: "沙盒課", content },
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(inspectMdxSource).toHaveBeenCalledWith(content);
		expect(db.lesson.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "lesson-01" },
				data: expect.objectContaining({ content }),
			}),
		);
	});

	it("允許純文字講義並持久化", async () => {
		const content = "# 標題\n\n一般講義內容。";
		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update_lesson",
					payload: { id: "lesson-01", title: "單元", content },
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(db.lesson.update).toHaveBeenCalledTimes(1);
	});

	it.each([
		["<UnauthorizedBlock />", "講義內容含有未授權元件：UnauthorizedBlock"],
		["<EvilWidget />", "講義內容含有未授權元件：EvilWidget"],
		["<script>alert(1)</script>", "講義內容含有不允許的 HTML。"],
	])("拒絕不安全的 MDX：%s", async (content, error) => {
		vi.mocked(inspectMdxSource).mockReturnValue({ ok: false, error });

		const response = await POST(
			new Request("http://localhost/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update_lesson",
					payload: { id: "lesson-01", title: "不安全內容", content },
				}),
			}),
		);

		expect(response.status).toBe(400);
		const body = await response.json();
			expect(body.error).toBe(COURSE_STUDIO_ERROR_CODES.INVALID_MDX_CONTENT);
			expect(body.details).toBe(error);
		expect(db.lesson.update).not.toHaveBeenCalled();
	});
});
