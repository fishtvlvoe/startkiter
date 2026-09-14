import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());
const listPublishedBundlesMock = vi.hoisted(() => vi.fn());

vi.mock("@auth/lib/server", () => ({ getSession: getSessionMock }));
vi.mock("@startkiter/bundles", () => ({
	listPublishedBundles: (...args: unknown[]) => listPublishedBundlesMock(...args),
}));
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
}));
vi.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => key,
}));
vi.mock("@shared/components/AuthWrapper", () => ({
	AuthWrapper: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-wrapper">{children}</div>,
}));

import BundlesBrowsePage from "./page";

describe("/bundles browse page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({ user: { id: "user_1", email: "buyer@example.com" } });
		listPublishedBundlesMock.mockResolvedValue([
			{
				id: "combo-a",
				slug: "combo-a",
				title: "已發布組合",
				description: "公開可見的簡述",
				priceTwd: 5000,
				status: "published",
				courseIds: ["lesson-01"],
			},
		]);
	});

	it("lists only published bundles with title, price, description, and detail links", async () => {
		const html = renderToStaticMarkup(await BundlesBrowsePage());

		expect(html).toContain("已發布組合");
		expect(html).toContain("公開可見的簡述");
		expect(html).toMatch(/5,?000/);
		expect(html).toContain('href="/bundles/combo-a"');
		expect(html).not.toContain("草稿組合");
		expect(html).not.toContain("封存組合");
		expect(listPublishedBundlesMock).toHaveBeenCalledOnce();
	});

	it("redirects unauthenticated visitors to login with next=/bundles", async () => {
		getSessionMock.mockResolvedValue(null);

		await expect(BundlesBrowsePage()).rejects.toThrow("REDIRECT:/login?next=/bundles");
	});
});
