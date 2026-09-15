export {
	BATCH_SIZE,
	CampaignStateError,
	cancelCampaign,
	captureSenderSnapshot,
	dispatchCampaignBatch,
	pauseCampaign,
	queueDueScheduledCampaigns,
	requestImmediateSend,
	resumeCampaign,
	runNewsletterDispatchTick,
	scheduleCampaign,
	transitionCampaignStatus,
} from "./lib/send-engine";
export {
	applyUnsubscribe,
	assertEmailConsent,
	recordEmailConsent,
} from "./lib/email-consent";
export type {
	AssertEmailConsentResult,
	ConsentAction,
	ConsentKind,
	EmailConsentType,
	UnsubscribeScope,
} from "./lib/email-consent";
export {
	createUnsubscribeToken,
	generateUnsubscribeToken,
	hasDedicatedNewsletterSecret,
	verifyUnsubscribeToken,
} from "./lib/unsubscribe-token";
export {
	assertPromotionalCampaignCanActivate,
	NewsletterComplianceError,
	NEWSLETTER_SITE_SETTING_ID,
	parseNewsletterSiteSettings,
	serializeNewsletterSiteSettings,
} from "./lib/compliance";
export type {
	CampaignActivationInput,
	NewsletterSiteSettings,
} from "./lib/compliance";
