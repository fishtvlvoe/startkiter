export const NEWSLETTER_SITE_SETTING_ID = "newsletter";

export type NewsletterSiteSettings = {
	senderPhysicalAddress: string;
};

export type CampaignActivationInput = {
	type: "GENERAL" | "PROMO";
	senderPhysicalAddress?: string | null;
};

export class NewsletterComplianceError extends Error {
	readonly code = "sender_physical_address_required";

	constructor() {
		super("A physical sender address is required before activating a promotional campaign.");
		this.name = "NewsletterComplianceError";
	}
}

export function assertPromotionalCampaignCanActivate(input: CampaignActivationInput): { ok: true } {
	if (input.type === "PROMO" && !input.senderPhysicalAddress?.trim()) {
		throw new NewsletterComplianceError();
	}
	return { ok: true };
}

export function parseNewsletterSiteSettings(payload: string | null | undefined): NewsletterSiteSettings {
	if (!payload) return { senderPhysicalAddress: "" };
	try {
		const value: unknown = JSON.parse(payload);
		if (typeof value !== "object" || value === null || Array.isArray(value)) {
			return { senderPhysicalAddress: "" };
		}
		const senderPhysicalAddress = (value as { senderPhysicalAddress?: unknown }).senderPhysicalAddress;
		return { senderPhysicalAddress: typeof senderPhysicalAddress === "string" ? senderPhysicalAddress : "" };
	} catch {
		return { senderPhysicalAddress: "" };
	}
}

export function serializeNewsletterSiteSettings(settings: NewsletterSiteSettings): string {
	return JSON.stringify({ senderPhysicalAddress: settings.senderPhysicalAddress });
}
