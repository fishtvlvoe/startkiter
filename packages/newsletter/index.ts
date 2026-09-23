
export type {
	AssertEmailConsentFn,
	CampaignStatus,
	DispatchBatchOptions,
	DispatchBatchResult,
	NewsletterCampaignStatus,
	SenderSnapshot,
} from "./lib/send-engine";
export {
	BATCH_SIZE,
	CampaignStateError,
	captureSenderSnapshot,
	SendEngineError,
	cancelCampaign,
	dispatchCampaignBatch,
	dispatchNewsletters,
	pauseCampaign,
	processCampaignDispatch,
	queueDueCampaigns,
	queueDueScheduledCampaigns,
	requestImmediateSend,
	resumeCampaign,
	runNewsletterDispatchTick,
	scheduleCampaign,
	sendEngineClock,
	startCampaignSend,
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
export {
	buildAudienceWhere,
	countSelectedRecipients,
	createDebouncedAudienceEstimator,
	enforcePromoAudienceSegment,
	estimateAudience,
	getAudienceUsers,
	parseSegmentJson,
	PromoAudienceLockError,
	resolveDispatchRecipients,
	segmentHasMarketingConsentLock,
} from "./lib/audience";
export type {
	AudienceEstimate,
	AudienceRecipient,
	AudienceUserRow,
	NewsletterAudienceType,
	SegmentJson,
	SegmentRule,
} from "./lib/audience";
export {
	assertCouponValidForSend,
	assertPromoAudienceLocked,
	bindBundleCardBlock,
	bindCountdownBlock,
	bindCouponBlock,
	bindCourseCardBlock,
	getPromoAudienceUiState,
	renderPromoBlockHtml,
	withUtmParams,
} from "./lib/promo-blocks";
export type {
	CatalogBundle,
	CatalogCourse,
	CouponRecord,
	PromoAudienceUiState,
	PromoNewsletterBlock,
} from "./lib/promo-blocks";
export {
	createPromoCountdownBlock,
	createPromoCouponBlock,
	createPromoCourseBlock,
	renderCampaignHtml,
} from "./lib/render";
export type {
	NewsletterContentBlock,
	NewsletterContentJson,
	NewsletterBlockContent,
	NewsletterButtonBlock,
	NewsletterDividerBlock,
	NewsletterHeadingBlock,
	NewsletterImageBlock,
	NewsletterInlineNode,
	NewsletterInlineStyles,
	NewsletterParagraphBlock,
	NewsletterVideoCardBlock,
	RenderCampaignOptions,
	RenderCampaignResult,
} from "./lib/render";
export { sendEmail } from "@startkiter/mail";


export {
	NEWSLETTER_SENDER_ADDRESS_SETTING_ID,
	assertSenderAddressConfigured,
	getSenderPhysicalAddress,
	setSenderPhysicalAddress,
} from "./lib/sender-address";
