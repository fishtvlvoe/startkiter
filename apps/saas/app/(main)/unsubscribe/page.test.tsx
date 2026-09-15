// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createUnsubscribeToken } from "@startkiter/newsletter";

const findUnique = vi.hoisted(() => vi.fn());

vi.mock("@startkiter/database", () => ({
	db: { user: { findUnique } },
}));

import UnsubscribePage from "./page";

describe("unsubscribe preference page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "newsletter-secret-2026");
		findUnique.mockResolvedValue({
			id: "user-1",
			email: "learner@example.com",
			generalEmailConsent: true,
			marketingConsent: true,
			unsubscribedAt: null,
		});
	});

	it("renders independent promotional, general, and all preference switches", async () => {
		const token = createUnsubscribeToken({
			userId: "user-1",
			email: "learner@example.com",
			scope: "all",
		});
		const element = await UnsubscribePage({
			searchParams: Promise.resolve({
				userId: "user-1",
				email: "learner@example.com",
				scope: "all",
				token,
			}),
		});
		const html = renderToStaticMarkup(element);

		expect(html).toContain("促銷電子報");
		expect(html).toContain("一般電子報");
		expect(html).toContain("全部退訂");
		expect(html.match(/type="checkbox"/g)).toHaveLength(3);
	});
});
