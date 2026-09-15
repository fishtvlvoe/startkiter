import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, update, create, transaction, campaignUpdate } = vi.hoisted(() => ({
	findUnique: vi.fn(),
	update: vi.fn(),
	create: vi.fn(),
	campaignUpdate: vi.fn(),
	transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique, update },
		emailConsentLog: { create },
		newsletterCampaign: { update: campaignUpdate },
		$transaction: transaction,
	},
}));

vi.mock("@startkiter/newsletter", async () => {
	const actual = await vi.importActual<typeof import("@startkiter/newsletter")>(
		"@startkiter/newsletter",
	);
	return actual;
});

import { createUnsubscribeToken } from "@startkiter/newsletter";

import { loadUnsubscribePageState } from "../../(main)/unsubscribe/page";
import { GET, POST } from "./route";

describe("unsubscribe GET vs POST", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NEWSLETTER_UNSUBSCRIBE_SECRET", "newsletter-secret-for-tests");
		findUnique.mockResolvedValue({
			email: "learner@example.com",
			generalEmailConsent: true,
			marketingConsent: true,
			unsubscribedAt: null,
		});
		update.mockResolvedValue({});
		create.mockResolvedValue({});
	});

	it("GET API does not write to the database", async () => {
		const response = await GET();
		expect(response.status).toBe(405);
		expect(update).not.toHaveBeenCalled();
		expect(create).not.toHaveBeenCalled();
	});

	it("GET page loader only reads user and does not mutate consent", async () => {
		const token = createUnsubscribeToken({
			userId: "user_1",
			email: "learner@example.com",
			scope: "general",
		});

		await loadUnsubscribePageState({
			email: "learner@example.com",
			token,
			status: "",
			campaignId: "",
		});

		expect(findUnique).toHaveBeenCalled();
		expect(update).not.toHaveBeenCalled();
		expect(create).not.toHaveBeenCalled();
	});

	it("POST applies general unsubscribe without clearing marketingConsent", async () => {
		const token = createUnsubscribeToken({
			userId: "user_1",
			email: "learner@example.com",
			scope: "general",
		});

		update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => {
			expect(data).toEqual({ generalEmailConsent: false });
			expect(data).not.toHaveProperty("marketingConsent");
			return {};
		});

		const response = await POST(
			new Request("http://localhost/api/unsubscribe", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email: "learner@example.com", token }),
			}),
		);

		expect(response.status).toBe(200);
		expect(update).toHaveBeenCalled();
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					consentType: "GENERAL",
					action: "REVOKED",
				}),
			}),
		);
	});
});
