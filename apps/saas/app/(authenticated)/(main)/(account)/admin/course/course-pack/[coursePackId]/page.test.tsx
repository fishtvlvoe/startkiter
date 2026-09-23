import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());
const isOperatorMock = vi.hoisted(() => vi.fn());
const coursePackFindUniqueMock = vi.hoisted(() => vi.fn());

vi.mock("@auth/lib/server", () => ({ getSession: getSessionMock }));
vi.mock("@startkiter/permissions", () => ({ isOperator: isOperatorMock }));
vi.mock("@startkiter/database", () => ({ db: { coursePack: { findUnique: coursePackFindUniqueMock } } }));
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
	notFound: () => {
		throw new Error("NOT_FOUND");
	},
}));

import AdminCoursePackDetailPage from "./page";

describe("Admin CoursePack detail page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({ user: { id: "operator-1", email: "operator@example.com" } });
		isOperatorMock.mockReturnValue(true);
		coursePackFindUniqueMock.mockResolvedValue({
			id: "pack-1",
			title: "開站任務包",
			status: "active",
			missions: [
				{ id: "mission-row-1", title: "部署網站", goal: "完成部署", sortOrder: 0 },
				{ id: "mission-row-2", title: "設定網域", goal: "完成網域設定", sortOrder: 1 },
			],
		});
	});

	it("拒絕非 operator", async () => {
		isOperatorMock.mockReturnValue(false);

		await expect(
			AdminCoursePackDetailPage({ params: Promise.resolve({ coursePackId: "pack-1" }) }),
		).rejects.toThrow("REDIRECT:/");
		expect(coursePackFindUniqueMock).not.toHaveBeenCalled();
	});

	it("列出 Mission 的標題、目標與排序", async () => {
		const html = renderToStaticMarkup(
			await AdminCoursePackDetailPage({ params: Promise.resolve({ coursePackId: "pack-1" }) }),
		);

		expect(html).toContain("開站任務包");
		expect(html).toContain("部署網站");
		expect(html).toContain("完成部署");
		expect(html).toContain("設定網域");
		expect(html).toContain("data-sort-order=\"1\"");
		expect(coursePackFindUniqueMock).toHaveBeenCalledWith({
			where: { id: "pack-1" },
			include: { missions: { orderBy: { sortOrder: "asc" } } },
		});
	});
});
