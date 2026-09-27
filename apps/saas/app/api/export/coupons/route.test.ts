import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@startkiter/database", () => ({
	db: {
		coupon: { findMany: vi.fn() },
		order: { findMany: vi.fn() },
	},
}));
vi.mock("@startkiter/api/modules/admin/procedures/export-coupons-spreadsheet", () => ({
	exportCouponsSpreadsheet: { callable: vi.fn() },
}));

import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { exportCouponsSpreadsheet } from "@startkiter/api/modules/admin/procedures/export-coupons-spreadsheet";
import { GET } from "./route";

describe("GET /api/export/coupons (Requirement: Admin can download the coupon spreadsheet)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("未登入呼叫回傳 401", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null);
		const response = await GET(new Request("http://localhost/api/export/coupons"));
		expect(response.status).toBe(401);
	});

	it("無 admin.access 呼叫回傳 403 (Scenario: Coupon export rejects a non-admin)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "user-1", role: "user" },
		} as any);
		const response = await GET(new Request("http://localhost/api/export/coupons"));
		expect(response.status).toBe(403);
	});

	it("有權限且無資料得 200 與 xlsx 內容類型 (Scenario: Admin downloads coupons)", async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: "admin-1", role: "admin" },
		} as any);
		vi.mocked(db.coupon.findMany).mockResolvedValue([]);
		vi.mocked(exportCouponsSpreadsheet.callable).mockReturnValue(
			vi.fn().mockResolvedValue({
				filename: "coupons.xlsx",
				contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				data: Buffer.from("xlsx-content").toString("base64"),
			}) as never,
		);

		const response = await GET(new Request("http://localhost/api/export/coupons"));
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
		expect(response.headers.get("Content-Disposition")).toContain("coupons.xlsx");
	});
});
