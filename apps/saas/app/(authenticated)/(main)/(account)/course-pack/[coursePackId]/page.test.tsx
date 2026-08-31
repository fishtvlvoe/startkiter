import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());
const coursePackFindUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("@auth/lib/server", () => ({ getSession: getSessionMock }));
vi.mock("@startkiter/database", () => ({ db: { coursePack: { findUnique: coursePackFindUniqueMock } } }));
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
	notFound: () => {
		throw new Error("NOT_FOUND");
	},
}));

import CoursePackPage from "./page";

describe("Learner CoursePack page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({ user: { id: "learner-1", email: "learner@example.com" } });
		coursePackFindUniqueMock.mockResolvedValue({
			id: "pack-1",
			title: "開站任務包",
			missions: [
				{
					id: "mission-row-1",
					title: "設定 Bunny",
					goal: "建立 Storage Zone",
					sortOrder: 0,
					missionData: {
						id: "mission-1",
						title: "設定 Bunny",
						goal: "建立 Storage Zone",
						action: {
							surface: "structured_form",
							fields: [{ key: "bunnyApiKey", label: "Bunny API Key", inputType: "text", required: true }],
						},
						evaluator: {
							type: "external_check",
							check_id: "bunny_zone_created",
							params: {},
							poll_interval_seconds: 1,
							timeout_seconds: 5,
						},
						feedback: { success: "完成", failure: "再試一次" },
						consequence: { success: "下一關", failure: "看提示" },
						recovery: [{ attempt: 1, level: "L1", hint: "確認 Key" }],
						evidence: [{ type: "reflection", label: "完成說明", required: true }],
					},
				},
			],
		});
	});

	it("逐一渲染 Mission action 並提供送出與檢查入口", async () => {
		const html = renderToStaticMarkup(
			await CoursePackPage({ params: Promise.resolve({ coursePackId: "pack-1" }) }),
		);

		expect(html).toContain('data-testid="course-pack-mission-player"');
		expect(html).toContain("設定 Bunny");
		expect(html).toContain("建立 Storage Zone");
		expect(html).toContain('name="bunnyApiKey"');
		expect(html).toContain("送出並檢查");
		expect(html).toContain("bunny_zone_created");
	});
});
