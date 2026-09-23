import { describe, expect, it } from "vitest";

import type { Prisma } from "../../prisma/generated/client";

describe("newsletter automation schema contract", () => {
	it("exposes NewsletterCampaign create input with woomin-aligned core fields", () => {
		const campaign = {
			name: "Launch promo",
			subject: "歡迎回來",
			contentJson: { blocks: [] },
			createdBy: { connect: { id: "user_admin" } },
			type: "PROMO",
			status: "DRAFT",
			ratePerMinute: 60,
			attributionWindowDays: 7,
		} satisfies Prisma.NewsletterCampaignCreateInput;

		expect(campaign.type).toBe("PROMO");
		expect(campaign.status).toBe("DRAFT");
		expect(campaign.ratePerMinute).toBe(60);
	});

	it("exposes User marketing consent fields as optional/defaulted create inputs", () => {
		const consent = {
			marketingConsent: true,
			marketingConsentAt: new Date("2026-09-16T00:00:00.000Z"),
			marketingConsentSource: "checkout",
			marketingConsentIp: "127.0.0.1",
			generalEmailConsent: true,
			generalEmailConsentAt: new Date("2026-09-16T00:00:00.000Z"),
			unsubscribedAt: null,
			emailInvalidAt: null,
			emailBounceState: "NONE",
			emailBounceCount: 0,
		} satisfies Pick<
			Prisma.UserCreateInput,
			| "marketingConsent"
			| "marketingConsentAt"
			| "marketingConsentSource"
			| "marketingConsentIp"
			| "generalEmailConsent"
			| "generalEmailConsentAt"
			| "unsubscribedAt"
			| "emailInvalidAt"
			| "emailBounceState"
			| "emailBounceCount"
		>;

		expect(consent.marketingConsent).toBe(true);
		expect(consent.emailBounceState).toBe("NONE");
		expect(consent.generalEmailConsent).toBe(true);
	});

	it("exposes NewsletterAutomation graph and Order.newsletterCampaignId", () => {
		const automation = {
			name: "Course drip",
			course: { connect: { id: "course_1" } },
			enabled: false,
			steps: {
				create: [
					{
						stepOrder: 1,
						delayDays: 1,
						subjectTemplate: "Day 1",
						contentJson: { blocks: [] },
					},
				],
			},
		} satisfies Prisma.NewsletterAutomationCreateInput;

		const orderPatch = {
			newsletterCampaign: { connect: { id: "camp_1" } },
		} satisfies Pick<Prisma.OrderUpdateInput, "newsletterCampaign">;

		expect(automation.enabled).toBe(false);
		expect(orderPatch.newsletterCampaign.connect.id).toBe("camp_1");
	});

	it("exposes EmailConsentLog and NewsletterAlert create inputs", () => {
		const consentLog = {
			email: "learner@example.com",
			consentType: "MARKETING",
			action: "GRANTED",
			source: "checkout",
		} satisfies Prisma.EmailConsentLogCreateInput;

		const alert = {
			title: "Send stalled",
			message: "Heartbeat missing",
			type: "WARNING",
		} satisfies Prisma.NewsletterAlertCreateInput;

		expect(consentLog.consentType).toBe("MARKETING");
		expect(alert.type).toBe("WARNING");
	});
});
