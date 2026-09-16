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
	RenderCampaignOptions,
	RenderCampaignResult,
} from "./lib/render";
