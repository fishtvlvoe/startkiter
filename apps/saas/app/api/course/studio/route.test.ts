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
		lesson: {
			update: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/api/modules/course/lib/video-resolver", () => ({
	resolveVideoSource: vi.fn(),
}));

vi.mock("@startkiter/course", () => ({
	inspectMdxSource: vi.fn(),
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { inspectMdxSource } from "@startkiter/course";
import { POST } from "./route";

	describe("Course Studio API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "operator@example.com";
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "operator-01", email: "operator@example.com" },
		} as never);
		vi.mocked(inspectMdxSource).mockReturnValue({ ok: true });
		vi.mocked(db.lesson.update).mockResolvedValue({
			id: "lesson-01",
			content: "<WebContainerSandbox blockId=\"demo\" files={{}} hints={[]} />",
		} as never);
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

	it.each([
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
		expect(db.lesson.update).not.toHaveBeenCalled();
	});
});
