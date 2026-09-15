import { describe, expect, it } from "vitest";

import {
	assertPromotionalCampaignCanActivate,
	parseNewsletterSiteSettings,
	serializeNewsletterSiteSettings,
} from "./compliance";

describe("promotional campaign sender-address gate", () => {
	it("blocks activation when the physical sender address is missing", () => {
		expect(() =>
			assertPromotionalCampaignCanActivate({
				type: "PROMO",
				senderPhysicalAddress: "   ",
			}),
		).toThrow(/physical sender address/i);
	});

	it("allows a promotional campaign when the address is configured", () => {
		expect(
			assertPromotionalCampaignCanActivate({
				type: "PROMO",
				senderPhysicalAddress: "台北市中正區測試路 1 號",
			}),
		).toEqual({ ok: true });
	});

	it("stores senderPhysicalAddress in the SiteSetting payload", () => {
		const encoded = serializeNewsletterSiteSettings({ senderPhysicalAddress: "台北市中正區測試路 1 號" });
		expect(parseNewsletterSiteSettings(encoded)).toEqual({ senderPhysicalAddress: "台北市中正區測試路 1 號" });
	});
});
