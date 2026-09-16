import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	campaignFindFirst,
	recipientDeleteMany,
	recipientFindMany,
	recipientCreateMany,
	campaignUpdate,
	transaction,
	getNewsletterSiteSettings,
	scheduleCampaign,
} = vi.hoisted(() => ({
	campaignFindFirst: vi.fn(),
	recipientDeleteMany: vi.fn(),
	recipientFindMany: vi.fn(),
	recipientCreateMany: vi.fn(),
	campaignUpdate: vi.fn(),
	transaction: vi.fn(),
	getNewsletterSiteSettings: vi.fn(),
	scheduleCampaign: vi.fn(),
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
vi.mock("../../../../../../lib/newsletter-settings", () => ({ getNewsletterSiteSettings }));
vi.mock("@startkiter/newsletter", () => ({
	assertPromotionalCampaignCanActivate: vi.fn((input: { type: string; senderPhysicalAddress?: string }) => {
		if (input.type === "PROMO" && !input.senderPhysicalAddress?.trim()) {
			throw new Error("A physical sender address is required before activating a promotional campaign.");
		}
		return { ok: true };
	}),
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
	scheduleCampaign,
	sendEmail: vi.fn(),
}));

import { prepareNewsletterAudience, scheduleNewsletter } from "./actions";

describe("prepareNewsletterAudience", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		campaignFindFirst.mockResolvedValue({ id: "campaign-1", type: "PROMO" });
		getNewsletterSiteSettings.mockResolvedValue({ senderPhysicalAddress: "" });
		recipientDeleteMany.mockResolvedValue({ count: 0 });
		recipientFindMany.mockResolvedValue([
			{ id: "test-recipient-1", toEmail: "staff@example.com" },
			{ id: "test-recipient-2", toEmail: "other@example.com" },
		]);
		recipientCreateMany.mockResolvedValue({ count: 1 });
		campaignUpdate.mockResolvedValue({ id: "campaign-1" });
		scheduleCampaign.mockResolvedValue(undefined);
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

	it("blocks a promotional send when the sender physical address is missing", async () => {
		campaignFindFirst.mockResolvedValue({
			id: "campaign-1",
			type: "PROMO",
			contentJson: { blocks: [] },
			segmentJson: { preset: "manual", mode: "AND", rules: [] },
		});

		const { sendNewsletter } = await import("./actions");
		await expect(sendNewsletter({ campaignId: "campaign-1" })).resolves.toEqual({
			ok: false,
			error: expect.stringMatching(/physical sender address/i),
		});
	});

	it("schedules a campaign for a future time through the send engine", async () => {
		campaignFindFirst.mockResolvedValue({
			id: "campaign-1",
			type: "GENERAL",
			contentJson: { blocks: [] },
			segmentJson: { preset: "all", mode: "AND", rules: [] },
		});
		const scheduledAt = new Date(Date.now() + 5 * 60_000).toISOString();

		await expect(scheduleNewsletter({ campaignId: "campaign-1", scheduledAt })).resolves.toEqual({ ok: true });

		expect(scheduleCampaign).toHaveBeenCalledWith("campaign-1", expect.any(Date), expect.any(Object));
		expect(scheduleCampaign.mock.calls[0][1].toISOString()).toBe(scheduledAt);
	});

	it("rejects a schedule time in the past", async () => {
		const scheduledAt = new Date(Date.now() - 60_000).toISOString();

		await expect(scheduleNewsletter({ campaignId: "campaign-1", scheduledAt })).resolves.toEqual({
			ok: false,
			error: expect.stringMatching(/未來|future/i),
		});
		expect(scheduleCampaign).not.toHaveBeenCalled();
	});

	it("returns the send engine rejection when no eligible recipients exist", async () => {
		campaignFindFirst.mockResolvedValue({
			id: "campaign-1",
			type: "GENERAL",
			contentJson: { blocks: [] },
			segmentJson: { preset: "all", mode: "AND", rules: [] },
		});
		scheduleCampaign.mockRejectedValue(new Error("Zero eligible recipients: cannot schedule or send this campaign"));

		await expect(scheduleNewsletter({
			campaignId: "campaign-1",
			scheduledAt: new Date(Date.now() + 5 * 60_000).toISOString(),
		})).resolves.toEqual({
			ok: false,
			error: expect.stringMatching(/Zero eligible recipients/),
		});
	});
});
