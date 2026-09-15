import { describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({
	findUnique: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique, update: vi.fn() },
		emailConsentLog: { create: vi.fn() },
		$transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
	},
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

import { createUnsubscribeToken } from "@startkiter/newsletter";

import { loadUnsubscribePageState } from "./page";

describe("unsubscribe page read/write separation", () => {
	it("GET loader verifies token and reads consent without writes", async () => {
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "newsletter-secret-for-tests");
		findUnique.mockResolvedValue({
			email: "learner@example.com",
			generalEmailConsent: true,
			marketingConsent: true,
			unsubscribedAt: null,
		});

		const token = createUnsubscribeToken({
			userId: "user_1",
			email: "learner@example.com",
			scope: "marketing",
		});

		const state = await loadUnsubscribePageState({
			email: "learner@example.com",
			token,
			status: "",
			campaignId: "",
		});

		expect(state.verified.ok).toBe(true);
		expect(state.user?.marketingConsent).toBe(true);
		expect(findUnique).toHaveBeenCalledTimes(1);
	});
});
