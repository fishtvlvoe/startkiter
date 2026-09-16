import { beforeEach, describe, expect, it, vi } from "vitest";

const { campaignFindFirst, recipientDeleteMany, recipientFindMany, recipientCreateMany, campaignUpdate, transaction } = vi.hoisted(() => ({
	campaignFindFirst: vi.fn(),
	recipientDeleteMany: vi.fn(),
	recipientFindMany: vi.fn(),
	recipientCreateMany: vi.fn(),
	campaignUpdate: vi.fn(),
	transaction: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		newsletterCampaign: { findFirst: campaignFindFirst, update: campaignUpdate },
		newsletterRecipient: {
			deleteMany: recipientDeleteMany,
			findMany: recipientFindMany,
			createMany: recipientCreateMany,
		},
		$transaction: transaction,
	},
}));

vi.mock("@startkiter/permissions", () => ({ isOperator: vi.fn(() => true) }));
vi.mock("@auth/lib/server", () => ({ getSession: vi.fn(async () => ({ user: { id: "admin-1", role: "ADMIN" } })) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@startkiter/newsletter", () => ({
	assertPromoAudienceLocked: vi.fn(() => ({ ok: true })),
	estimateAudience: vi.fn(async () => ({
		matched: 1,
		excluded: { unsubscribed: 0, invalid: 0, marketingMissing: 0 },
		sendable: 1,
		samples: [],
		recipients: [{ id: "user-1", name: "內部帳號", email: "staff@example.com", source: "user" }],
	})),
	normalizeEmail: (email: string) => email.trim().toLowerCase(),
	parseSegmentJson: vi.fn(() => ({ preset: "all", mode: "AND", rules: [] })),
	PromoAudienceLockError: class PromoAudienceLockError extends Error {},
	renderCampaignHtml: vi.fn(() => ({ html: "", text: "", sizeBytes: 0, isOversized: false, warnings: [] })),
	requestImmediateSend: vi.fn(),
	sendEmail: vi.fn(),
}));

import { prepareNewsletterAudience } from "./actions";

describe("prepareNewsletterAudience", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		campaignFindFirst.mockResolvedValue({ id: "campaign-1", type: "PROMO" });
		recipientDeleteMany.mockResolvedValue({ count: 0 });
		recipientFindMany.mockResolvedValue([
			{ id: "test-recipient-1", toEmail: "staff@example.com" },
			{ id: "test-recipient-2", toEmail: "other@example.com" },
		]);
		recipientCreateMany.mockResolvedValue({ count: 1 });
		campaignUpdate.mockResolvedValue({ id: "campaign-1" });
		transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
			newsletterRecipient: { deleteMany: recipientDeleteMany, findMany: recipientFindMany, createMany: recipientCreateMany },
			newsletterCampaign: { update: campaignUpdate },
		}));
	});

	it("does not let a prior test-send row suppress the same real recipient", async () => {
		const result = await prepareNewsletterAudience({
			campaignId: "campaign-1",
			preset: "manual",
			manualEmails: ["staff@example.com"],
		});

		expect(result).toEqual({ ok: true, recipientEstimate: 1 });
		expect(recipientDeleteMany).toHaveBeenCalledWith({ where: { id: { in: ["test-recipient-1"] } } });
		expect(recipientCreateMany).toHaveBeenCalledWith(expect.objectContaining({
		data: [expect.objectContaining({ toEmail: "staff@example.com", isTest: false, status: "PENDING" })],
	}));
	});
});
