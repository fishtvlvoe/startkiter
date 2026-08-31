import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());
const isOperatorMock = vi.hoisted(() => vi.fn());
const createProcedureClientMock = vi.hoisted(() => vi.fn());
const listCoursePacksMock = vi.hoisted(() => vi.fn());

vi.mock("@auth/lib/server", () => ({ getSession: getSessionMock }));
vi.mock("@startkiter/permissions", () => ({ isOperator: isOperatorMock }));
vi.mock("@orpc/server", () => ({ createProcedureClient: createProcedureClientMock }));
vi.mock("@startkiter/api/modules/course/procedures/list-course-packs", () => ({ listCoursePacks: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
}));

import AdminCoursePackPage from "./page";

describe("Admin CoursePack list page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({ user: { id: "operator-1", email: "operator@example.com" } });
		isOperatorMock.mockReturnValue(true);
		createProcedureClientMock.mockReturnValue(listCoursePacksMock);
		listCoursePacksMock.mockResolvedValue([
			{
				id: "pack-1",
				title: "開站任務包",
				status: "active",
				missionCount: 2,
				importedAt: "2026-08-30T03:00:00.000Z",
			},
		]);
	});

	it("拒絕非 operator", async () => {
		isOperatorMock.mockReturnValue(false);

		await expect(AdminCoursePackPage()).rejects.toThrow("REDIRECT:/");
		 expect(listCoursePacksMock).not.toHaveBeenCalled();
	});

	it("顯示 CoursePack 的標題、狀態、匯入時間與詳情連結", async () => {
		const html = renderToStaticMarkup(await AdminCoursePackPage());

		expect(html).toContain("開站任務包");
		expect(html).toContain("active");
		expect(html).toContain("2026/8/30");
		expect(html).toContain("/admin/course-pack/pack-1");
		expect(createProcedureClientMock).toHaveBeenCalled();
	});
});
