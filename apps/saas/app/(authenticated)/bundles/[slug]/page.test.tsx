import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());
const getBundleBySlugMock = vi.hoisted(() => vi.fn());
const userCanAccessCourseIdMock = vi.hoisted(() => vi.fn());

vi.mock("@auth/lib/server", () => ({ getSession: getSessionMock }));
vi.mock("@startkiter/bundles", () => ({
	getBundleBySlug: (...args: unknown[]) => getBundleBySlugMock(...args),
}));
vi.mock("@startkiter/api/modules/course/lib/course-access", () => ({
	userCanAccessCourseId: (...args: unknown[]) => userCanAccessCourseIdMock(...args),
}));
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
	notFound: () => {
		throw new Error("NOT_FOUND");
	},
}));
vi.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => key,
}));
vi.mock("@shared/components/AuthWrapper", () => ({
	AuthWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-wrapper">{children}</div>,
}));
vi.mock("../../checkout/checkout-button", () => ({
	CheckoutButton: ({
		product,
	}: {
		product: { productId: string; title: string; amount: number };
	}) => (
		<button type="button" data-testid="checkout-button" data-product-id={product.productId}>
			{`購買${product.title} NT$${product.amount.toLocaleString()}`}
		</button>
	),
}));

import BundleDetailPage from "./page";

const publishedBundle = {
	id: "combo-a",
	slug: "combo-a",
	title: "測試組合",
	description: "兩堂課打包更划算",
	priceTwd: 5000,
	status: "published" as const,
	courseIds: ["lesson-01", "lesson-02"],
};

describe("/bundles/[slug] detail page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({ user: { id: "user_new", email: "new@example.com" } });
		getBundleBySlugMock.mockResolvedValue(publishedBundle);
		userCanAccessCourseIdMock.mockResolvedValue(false);
	});

	it("returns 200 content for a published bundle with title, price, and course list", async () => {
		const html = renderToStaticMarkup(
			await BundleDetailPage({ params: Promise.resolve({ slug: "combo-a" }) }),
		);

		expect(html).toContain("測試組合");
		expect(html).toMatch(/5,?000|NT\$\s*5/);
		expect(html).toContain("lesson-01");
		expect(html).toContain("lesson-02");
		expect(getBundleBySlugMock).toHaveBeenCalledWith("combo-a");
	});

	it("returns 404 for draft, archived, or nonexistent slug", async () => {
		getBundleBySlugMock.mockResolvedValue(null);

		await expect(
			BundleDetailPage({ params: Promise.resolve({ slug: "draft-combo" }) }),
		).rejects.toThrow("NOT_FOUND");

		await expect(
			BundleDetailPage({ params: Promise.resolve({ slug: "archived-combo" }) }),
		).rejects.toThrow("NOT_FOUND");

		await expect(
			BundleDetailPage({ params: Promise.resolve({ slug: "missing-combo" }) }),
		).rejects.toThrow("NOT_FOUND");
	});

	it("shows purchase entry when the buyer lacks access to every course", async () => {
		userCanAccessCourseIdMock.mockImplementation(async (_userId: string, courseId: string) => {
			return courseId === "lesson-01";
		});

		const html = renderToStaticMarkup(
			await BundleDetailPage({ params: Promise.resolve({ slug: "combo-a" }) }),
		);

		expect(html).toContain('data-testid="checkout-button"');
		expect(html).toContain('data-product-id="combo-a"');
		expect(html).toContain("購買測試組合");
		expect(html).not.toContain("已擁有");
	});

	it("shows owned state when the buyer can access every course in the bundle", async () => {
		userCanAccessCourseIdMock.mockResolvedValue(true);

		const html = renderToStaticMarkup(
			await BundleDetailPage({ params: Promise.resolve({ slug: "combo-a" }) }),
		);

		expect(html).toContain("已擁有");
		expect(html).not.toContain('data-testid="checkout-button"');
		expect(html).toMatch(/href="[^"]*\/course/);
	});

	it("shows purchase entry when the buyer has no course access at all", async () => {
		userCanAccessCourseIdMock.mockResolvedValue(false);

		const html = renderToStaticMarkup(
			await BundleDetailPage({ params: Promise.resolve({ slug: "combo-a" }) }),
		);

		expect(html).toContain('data-testid="checkout-button"');
		expect(html).toContain('data-product-id="combo-a"');
		expect(html).not.toContain("已擁有");
	});

	it("redirects unauthenticated visitors to login with next=/bundles/[slug]", async () => {
		getSessionMock.mockResolvedValue(null);

		await expect(
			BundleDetailPage({ params: Promise.resolve({ slug: "combo-a" }) }),
		).rejects.toThrow("REDIRECT:/login?next=/bundles/combo-a");
	});
});
