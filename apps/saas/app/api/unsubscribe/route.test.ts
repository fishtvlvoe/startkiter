import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, update, consentLogCreate, transaction } = vi.hoisted(() => ({
	findUnique: vi.fn(),
	update: vi.fn(),
	consentLogCreate: vi.fn(),
	transaction: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		user: { findUnique, update },
		emailConsentLog: { create: consentLogCreate },
		$transaction: transaction,
	},
}));

import { createUnsubscribeToken } from "@startkiter/newsletter";
import { GET, POST } from "./route";

describe("unsubscribe API", () => {
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
		transaction.mockImplementation(async (operations: unknown[] | ((tx: unknown) => unknown)) =>
			typeof operations === "function" ? operations({}) : Promise.all(operations),
		);
	});

	it("does not write on GET, including email-client prefetch", async () => {
		const token = createUnsubscribeToken({
			userId: "user-1",
			email: "learner@example.com",
			scope: "general",
		});
		const response = await GET(
			new Request(
				`http://localhost/api/unsubscribe?userId=user-1&email=learner%40example.com&scope=general&token=${encodeURIComponent(token)}`,
			),
		);

		expect(response.status).toBe(200);
		expect(update).not.toHaveBeenCalled();
		expect(consentLogCreate).not.toHaveBeenCalled();
	});

	it("writes on POST and general unsubscribe leaves marketing consent untouched", async () => {
		const token = createUnsubscribeToken({
			userId: "user-1",
			email: "learner@example.com",
			scope: "general",
		});
		const response = await POST(
			new Request("http://localhost/api/unsubscribe", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					userId: "user-1",
					email: "learner@example.com",
					scope: "general",
					token,
				}),
			}),
		);

		expect(response.status).toBe(200);
		expect(update).toHaveBeenCalledWith(
			expect.objectContaining({
			where: { id: "user-1" },
			data: expect.objectContaining({ generalEmailConsent: false }),
		}),
		);
		const updateData = update.mock.calls[0]?.[0]?.data as Record<string, unknown>;
		expect(updateData).not.toHaveProperty("marketingConsent");
		expect(consentLogCreate).toHaveBeenCalledWith(
			expect.objectContaining({
			data: expect.objectContaining({ consentType: "GENERAL", action: "REVOKED" }),
		}),
		);
	});
});
