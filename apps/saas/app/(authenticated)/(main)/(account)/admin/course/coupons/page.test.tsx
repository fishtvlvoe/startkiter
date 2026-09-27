import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(),
}));

vi.mock("@startkiter/api/modules/course/lib/course-instructor-access", () => ({
	manageableCourseWhereForUser: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		course: { findMany: vi.fn() },
		order: { findMany: vi.fn() },
		coupon: { findMany: vi.fn() },
	},
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));

import { getSession } from "@auth/lib/server";
import { manageableCourseWhereForUser } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { db } from "@startkiter/database";
import CourseCouponsPage from "./page";

const mockedGetSession = vi.mocked(getSession);
const mockedManageableCourseWhere = vi.mocked(manageableCourseWhereForUser);
const mockedDbCourseFindMany = vi.mocked(db.course.findMany);
const mockedDbOrderFindMany = vi.mocked(db.order.findMany);
const mockedDbCouponFindMany = vi.mocked(db.coupon.findMany);

describe("CourseCouponsPage (Requirement: Instructor used-coupon list stays scoped)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = "admin@example.com";
	});

	it("講師頁面不渲染建立表單，且列表維持自己課程的券 (Scenario: Instructor does not see create controls)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "instructor_1", email: "instructor@example.com", role: "user" },
			session: { id: "s1" },
		} as any);

		mockedManageableCourseWhere.mockResolvedValue({ id: "course_1" } as any);
		mockedDbCourseFindMany.mockResolvedValue([{ slug: "course-a" }] as any);
		mockedDbOrderFindMany.mockResolvedValue([{ couponId: "c_used" }] as any);
		mockedDbCouponFindMany.mockResolvedValue([
			{
				id: "c_used",
				code: "INST100",
				discountType: "amount",
				amountOff: 100,
				percentOff: null,
				timesRedeemed: 2,
				active: true,
			},
		] as any);

		const html = renderToStaticMarkup(await CourseCouponsPage());

		// 講師看到自己的券
		expect(html).toContain("INST100");
		expect(html).toContain("NT$ 100");

		// 講師不該看到建立優惠券的表單
		expect(html).not.toContain('action="/api/coupons"');
		expect(html).not.toContain('name="code"');
		expect(html).not.toContain("建立優惠券");
	});

	it("percent 券顯示百分比 (Scenario: percent coupon displays percent off)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "instructor_1", email: "instructor@example.com", role: "user" },
			session: { id: "s1" },
		} as any);

		mockedManageableCourseWhere.mockResolvedValue({ id: "course_1" } as any);
		mockedDbCourseFindMany.mockResolvedValue([{ slug: "course-a" }] as any);
		mockedDbOrderFindMany.mockResolvedValue([{ couponId: "c_pct" }] as any);
		mockedDbCouponFindMany.mockResolvedValue([
			{
				id: "c_pct",
				code: "SAVE20PCT",
				discountType: "percent", // 小寫 percent
				amountOff: null,
				percentOff: 20,
				timesRedeemed: 1,
				active: true,
			},
		] as any);

		const html = renderToStaticMarkup(await CourseCouponsPage());

		// 應該顯示 20%，不是 NT$ 0
		expect(html).toContain("SAVE20PCT");
		expect(html).toContain("20%");
		expect(html).not.toContain("NT$ 0");
	});

	it("營運人員頁面渲染建立表單", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "admin_1", email: "admin@example.com", role: "admin" },
			session: { id: "s_admin" },
		} as any);

		mockedManageableCourseWhere.mockResolvedValue({} as any);
		mockedDbCourseFindMany.mockResolvedValue([]);
		mockedDbOrderFindMany.mockResolvedValue([]);
		mockedDbCouponFindMany.mockResolvedValue([]);

		const html = renderToStaticMarkup(await CourseCouponsPage());

		// 營運人員看到建立表單
		expect(html).toContain("建立優惠券");
		expect(html).toContain('action="/api/coupons"');
		expect(html).toContain("/api/export/coupons");
	});

	it("ADMIN_EMAIL fallback operator 但無 admin.access 時，不顯示匯出按鈕 (Requirement: Export button requires admin.access)", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: "admin@example.com", role: "user" },
			session: { id: "s_op" },
		} as any);

		mockedManageableCourseWhere.mockResolvedValue({} as any);
		mockedDbCourseFindMany.mockResolvedValue([]);
		mockedDbOrderFindMany.mockResolvedValue([]);
		mockedDbCouponFindMany.mockResolvedValue([]);

		const html = renderToStaticMarkup(await CourseCouponsPage());

		// 具備 isOperator 權限所以看到管理/建立表單
		expect(html).toContain("建立優惠券");
		// 但沒有 admin.access 權限，因此不可看見匯出按鈕
		expect(html).not.toContain("/api/export/coupons");
	});
});
