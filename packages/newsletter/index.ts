export type {
	ConsentEmailType,
	ConsentResult,
	RecordMarketingConsentParams,
} from "./lib/email-consent";
export type { UnsubscribeScope } from "./lib/unsubscribe-token";
export {
	applyUnsubscribe,
	assertEmailConsent,
	recordMarketingConsent,
} from "./lib/email-consent";
export {
	createUnsubscribeToken,
	hasDedicatedNewsletterSecret,
	verifyUnsubscribeToken,
} from "./lib/unsubscribe-token";
export {
	NEWSLETTER_SENDER_ADDRESS_SETTING_ID,
	assertSenderAddressConfigured,
	getSenderPhysicalAddress,
	setSenderPhysicalAddress,
} from "./lib/sender-address";
export type {
	NewsletterCampaignStatus,
	SenderSnapshot,
} from "./lib/send-engine";
export {
	SendEngineError,
	cancelCampaign,
	dispatchNewsletters,
	pauseCampaign,
	processCampaignDispatch,
	queueDueCampaigns,
	resumeCampaign,
	sendEngineClock,
	startCampaignSend,
	transitionCampaignStatus,
} from "./lib/send-engine";
