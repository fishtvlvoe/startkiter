import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(),
}));

vi.mock("../lib/course-access", () => ({
	userHasCourseAccess: vi.fn(),
	userHasKitClaimAccess: vi.fn(),
}));

vi.mock("@shared/components/AuthWrapper", () => ({
	AuthWrapper: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("./(authenticated)/checkout/checkout-button", () => ({
	CheckoutButton: () => null,
}));

vi.mock("@startkiter/database", () => ({
	db: {
		course: {
			findFirst: vi.fn().mockResolvedValue(null),
		},
		order: {
			findFirst: vi.fn().mockResolvedValue(null),
		},
	},
	getEligibleKitOrderForUser: vi.fn(),
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

vi.mock("./(authenticated)/(main)/(account)/course/course-review-panel", () => ({
	CourseReviewPanel: () => null,
}));

import { getSession } from "@auth/lib/server";
import { userHasCourseAccess, userHasKitClaimAccess } from "../lib/course-access";
import CheckoutPage from "./(authenticated)/checkout/page";
import CoursePage from "./(authenticated)/(main)/(account)/course/page";

describe("Claim entry point on checkout and course pages (Task 4.1)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getSession).mockResolvedValue({
			user: { id: "user-1", email: "user@example.com" },
			session: { id: "sess-1" },
		} as never);
	});

	describe("Checkout Page", () => {
		it("當 kitClaimEligible 為 true 時，結帳頁渲染可點擊的「領取代碼包」按鈕", async () => {
			vi.mocked(userHasCourseAccess).mockResolvedValue(true);
			vi.mocked(userHasKitClaimAccess).mockResolvedValue(true);

			const jsx = await CheckoutPage();
			const html = renderToStaticMarkup(jsx);

			expect(html).toContain("領取代碼包");
			expect(html).toContain('data-testid="kit-claim-button"');
		});

		it("當 kitClaimEligible 為 false 時，結帳頁不渲染領取代碼包按鈕", async () => {
			vi.mocked(userHasCourseAccess).mockResolvedValue(false);
			vi.mocked(userHasKitClaimAccess).mockResolvedValue(false);

			const jsx = await CheckoutPage();
			const html = renderToStaticMarkup(jsx);

			expect(html).not.toContain("領取代碼包");
			expect(html).not.toContain('data-testid="kit-claim-button"');
		});
	});

	describe("Course Page", () => {
		it("當 kitClaimEligible 為 true 時，課程頁渲染可點擊的「領取代碼包」按鈕", async () => {
			vi.mocked(userHasCourseAccess).mockResolvedValue(true);
			vi.mocked(userHasKitClaimAccess).mockResolvedValue(true);

			const jsx = await CoursePage();
			const html = renderToStaticMarkup(jsx);

			expect(html).toContain("領取代碼包");
			expect(html).toContain('data-testid="kit-claim-button"');
		});

		it("當 kitClaimEligible 為 false 時，課程頁不渲染領取代碼包按鈕", async () => {
			vi.mocked(userHasCourseAccess).mockResolvedValue(false);
			vi.mocked(userHasKitClaimAccess).mockResolvedValue(false);

			const jsx = await CoursePage();
			const html = renderToStaticMarkup(jsx);

			expect(html).not.toContain("領取代碼包");
			expect(html).not.toContain('data-testid="kit-claim-button"');
		});
	});
});
