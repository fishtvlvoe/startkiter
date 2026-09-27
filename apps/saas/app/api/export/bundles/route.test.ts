import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@startkiter/database", () => ({
	db: {
		bundle: { findMany: vi.fn() },
		order: { findMany: vi.fn() },
	},
}));
vi.mock("@startkiter/api/modules/admin/procedures/export-bundles-spreadsheet", () => ({
	exportBundlesSpreadsheet: { callable: vi.fn() },
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { exportBundlesSpreadsheet } from "@startkiter/api/modules/admin/procedures/export-bundles-spreadsheet";
import { GET } from "./route";

describe("GET /api/export/bundles (Requirement: Admin can download the bundle spreadsheet)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("未登入呼叫回傳 401 (Scenario: Missing session)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);
		const response = await GET(new Request("http://localhost/api/export/bundles"));
		expect(response.status).toBe(401);
	});

	it("無 admin.access 呼叫回傳 403 (Scenario: Signed-in user without admin access)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user-1", role: "user" },
		} as any);
		const response = await GET(new Request("http://localhost/api/export/bundles"));
		expect(response.status).toBe(403);
	});

	it("有權限且無資料得 200 與 xlsx 內容類型 (Scenario: No bundle rows)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin" },
		} as any);
		vi.mocked(db.bundle.findMany).mockResolvedValue([]);
		vi.mocked(exportBundlesSpreadsheet.callable).mockReturnValue(
			vi.fn().mockResolvedValue({
				filename: "bundles.xlsx",
				contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				data: Buffer.from("xlsx-content").toString("base64"),
			}) as never,
		);

		const response = await GET(new Request("http://localhost/api/export/bundles"));
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
		expect(response.headers.get("Content-Disposition")).toContain("bundles.xlsx");
	});
});
