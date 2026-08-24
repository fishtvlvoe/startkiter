/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted', 'ReadCommitted', 'RepeatableRead', 'Serializable'])

export type TransactionIsolationLevel = z.infer<typeof TransactionIsolationLevelSchema>;

// File: UserScalarFieldEnum.schema.ts

export const UserScalarFieldEnumSchema = z.enum(['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt', 'role', 'banned', 'banReason', 'banExpires', 'onboardingComplete', 'paymentsCustomerId', 'locale', 'twoFactorEnabled', 'lastActiveOrganizationId'])

export type UserScalarFieldEnum = z.infer<typeof UserScalarFieldEnumSchema>;

// File: SessionScalarFieldEnum.schema.ts

export const SessionScalarFieldEnumSchema = z.enum(['id', 'expiresAt', 'ipAddress', 'userAgent', 'userId', 'impersonatedBy', 'activeOrganizationId', 'token', 'createdAt', 'updatedAt'])

export type SessionScalarFieldEnum = z.infer<typeof SessionScalarFieldEnumSchema>;

// File: AccountScalarFieldEnum.schema.ts

export const AccountScalarFieldEnumSchema = z.enum(['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'expiresAt', 'password', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'createdAt', 'updatedAt'])

export type AccountScalarFieldEnum = z.infer<typeof AccountScalarFieldEnumSchema>;

// File: VerificationScalarFieldEnum.schema.ts

export const VerificationScalarFieldEnumSchema = z.enum(['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'])

export type VerificationScalarFieldEnum = z.infer<typeof VerificationScalarFieldEnumSchema>;

// File: PasskeyScalarFieldEnum.schema.ts

export const PasskeyScalarFieldEnumSchema = z.enum(['id', 'name', 'publicKey', 'userId', 'credentialID', 'counter', 'deviceType', 'backedUp', 'transports', 'aaguid', 'createdAt'])

export type PasskeyScalarFieldEnum = z.infer<typeof PasskeyScalarFieldEnumSchema>;

// File: TwoFactorScalarFieldEnum.schema.ts

export const TwoFactorScalarFieldEnumSchema = z.enum(['id', 'secret', 'backupCodes', 'verified', 'userId', 'failedVerificationCount', 'lockedUntil'])

export type TwoFactorScalarFieldEnum = z.infer<typeof TwoFactorScalarFieldEnumSchema>;

// File: OrganizationScalarFieldEnum.schema.ts

export const OrganizationScalarFieldEnumSchema = z.enum(['id', 'name', 'slug', 'logo', 'createdAt', 'metadata', 'paymentsCustomerId'])

export type OrganizationScalarFieldEnum = z.infer<typeof OrganizationScalarFieldEnumSchema>;

// File: MemberScalarFieldEnum.schema.ts

export const MemberScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'role', 'createdAt'])

export type MemberScalarFieldEnum = z.infer<typeof MemberScalarFieldEnumSchema>;

// File: InvitationScalarFieldEnum.schema.ts

export const InvitationScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'email', 'role', 'status', 'expiresAt', 'inviterId', 'createdAt'])

export type InvitationScalarFieldEnum = z.infer<typeof InvitationScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'organizationId', 'userId', 'type', 'customerId', 'subscriptionId', 'priceId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: NotificationScalarFieldEnum.schema.ts

export const NotificationScalarFieldEnumSchema = z.enum(['id', 'userId', 'type', 'data', 'link', 'read', 'createdAt', 'updatedAt'])

export type NotificationScalarFieldEnum = z.infer<typeof NotificationScalarFieldEnumSchema>;

// File: UserNotificationPreferenceScalarFieldEnum.schema.ts

export const UserNotificationPreferenceScalarFieldEnumSchema = z.enum(['id', 'userId', 'type', 'target', 'createdAt'])

export type UserNotificationPreferenceScalarFieldEnum = z.infer<typeof UserNotificationPreferenceScalarFieldEnumSchema>;

// File: LoginAttemptScalarFieldEnum.schema.ts

export const LoginAttemptScalarFieldEnumSchema = z.enum(['id', 'email', 'ipAddress', 'success', 'userAgent', 'createdAt'])

export type LoginAttemptScalarFieldEnum = z.infer<typeof LoginAttemptScalarFieldEnumSchema>;

// File: AdminLogScalarFieldEnum.schema.ts

export const AdminLogScalarFieldEnumSchema = z.enum(['id', 'adminId', 'action', 'targetType', 'targetId', 'details', 'ipAddress', 'createdAt'])

export type AdminLogScalarFieldEnum = z.infer<typeof AdminLogScalarFieldEnumSchema>;

// File: OrderScalarFieldEnum.schema.ts

export const OrderScalarFieldEnumSchema = z.enum(['id', 'orderNo', 'userId', 'sku', 'amount', 'currency', 'status', 'paymentGateway', 'gatewayTradeNo', 'courseAccess', 'kitClaimEligible', 'paidAt', 'refundedAt', 'invoiceType', 'invoiceCarrierType', 'invoiceCarrierId', 'invoiceTaxId', 'invoiceTitle', 'invoiceAddress', 'invoiceLoveCode', 'createdAt', 'updatedAt'])

export type OrderScalarFieldEnum = z.infer<typeof OrderScalarFieldEnumSchema>;

// File: GithubKitGrantScalarFieldEnum.schema.ts

export const GithubKitGrantScalarFieldEnumSchema = z.enum(['id', 'userId', 'githubUserId', 'githubLogin', 'org', 'repo', 'permission', 'status', 'orderNo', 'acceptedAt', 'revokedAt', 'createdAt', 'updatedAt'])

export type GithubKitGrantScalarFieldEnum = z.infer<typeof GithubKitGrantScalarFieldEnumSchema>;

// File: SiteSettingScalarFieldEnum.schema.ts

export const SiteSettingScalarFieldEnumSchema = z.enum(['id', 'ciphertext', 'updatedAt', 'updatedBy'])

export type SiteSettingScalarFieldEnum = z.infer<typeof SiteSettingScalarFieldEnumSchema>;

// File: BuyerDeploymentScalarFieldEnum.schema.ts

export const BuyerDeploymentScalarFieldEnumSchema = z.enum(['id', 'userId', 'tier', 'coolifyServerId', 'coolifyAppId', 'publicUrl', 'customDomain', 'status', 'lastDeployedAt', 'createdAt', 'updatedAt'])

export type BuyerDeploymentScalarFieldEnum = z.infer<typeof BuyerDeploymentScalarFieldEnumSchema>;

// File: SupportTicketScalarFieldEnum.schema.ts

export const SupportTicketScalarFieldEnumSchema = z.enum(['id', 'buyerDeploymentId', 'userId', 'chatwootConversationId', 'channel', 'status', 'aiSuggestedResolvedAt', 'resolvedAt', 'resolvedBy', 'createdAt', 'updatedAt'])

export type SupportTicketScalarFieldEnum = z.infer<typeof SupportTicketScalarFieldEnumSchema>;

// File: CourseScalarFieldEnum.schema.ts

export const CourseScalarFieldEnumSchema = z.enum(['id', 'slug', 'title', 'description', 'status', 'createdAt', 'updatedAt'])

export type CourseScalarFieldEnum = z.infer<typeof CourseScalarFieldEnumSchema>;

// File: CourseInstructorScalarFieldEnum.schema.ts

export const CourseInstructorScalarFieldEnumSchema = z.enum(['id', 'courseId', 'userId', 'createdById', 'createdAt'])

export type CourseInstructorScalarFieldEnum = z.infer<typeof CourseInstructorScalarFieldEnumSchema>;

// File: CourseVideoWatermarkSettingScalarFieldEnum.schema.ts

export const CourseVideoWatermarkSettingScalarFieldEnumSchema = z.enum(['id', 'courseId', 'enabled', 'showEmail', 'showCourseTitle', 'showTimestamp', 'emailDisplayMode', 'opacityPercent', 'textSize', 'movementMode', 'moveIntervalSec', 'tamperPauseEnabled', 'createdAt', 'updatedAt'])

export type CourseVideoWatermarkSettingScalarFieldEnum = z.infer<typeof CourseVideoWatermarkSettingScalarFieldEnumSchema>;

// File: CourseSubscriptionPlanScalarFieldEnum.schema.ts

export const CourseSubscriptionPlanScalarFieldEnumSchema = z.enum(['id', 'courseId', 'label', 'interval', 'price', 'sku', 'enabled', 'createdAt', 'updatedAt'])

export type CourseSubscriptionPlanScalarFieldEnum = z.infer<typeof CourseSubscriptionPlanScalarFieldEnumSchema>;

// File: CourseSubscriptionScalarFieldEnum.schema.ts

export const CourseSubscriptionScalarFieldEnumSchema = z.enum(['id', 'userId', 'courseId', 'planId', 'status', 'gatewayTradeNo', 'gatewaySubscriptionId', 'interval', 'pricePerPeriod', 'paidPeriods', 'currentPeriodEnd', 'lastPaymentAt', 'canceledAt', 'invoiceType', 'invoiceCarrierType', 'invoiceCarrierId', 'invoiceTaxId', 'invoiceTitle', 'invoiceAddress', 'invoiceLoveCode', 'createdAt', 'updatedAt'])

export type CourseSubscriptionScalarFieldEnum = z.infer<typeof CourseSubscriptionScalarFieldEnumSchema>;

// File: CourseInviteScalarFieldEnum.schema.ts

export const CourseInviteScalarFieldEnumSchema = z.enum(['id', 'courseId', 'tokenHash', 'email', 'maxUses', 'usedCount', 'expiresAt', 'active', 'createdBy', 'createdAt', 'updatedAt'])

export type CourseInviteScalarFieldEnum = z.infer<typeof CourseInviteScalarFieldEnumSchema>;

// File: CourseInviteRedemptionScalarFieldEnum.schema.ts

export const CourseInviteRedemptionScalarFieldEnumSchema = z.enum(['id', 'userId', 'courseId', 'inviteId', 'redeemedAt'])

export type CourseInviteRedemptionScalarFieldEnum = z.infer<typeof CourseInviteRedemptionScalarFieldEnumSchema>;

// File: InvoiceScalarFieldEnum.schema.ts

export const InvoiceScalarFieldEnumSchema = z.enum(['id', 'orderId', 'subscriptionId', 'periodNumber', 'provider', 'status', 'invoiceNumber', 'randomCode', 'invoiceDate', 'amount', 'allowanceTotal', 'failReason', 'attentionReason', 'rawResponse', 'createdAt', 'updatedAt'])

export type InvoiceScalarFieldEnum = z.infer<typeof InvoiceScalarFieldEnumSchema>;

// File: PaymentWebhookEventScalarFieldEnum.schema.ts

export const PaymentWebhookEventScalarFieldEnumSchema = z.enum(['id', 'gateway', 'eventId', 'eventType', 'status', 'payload', 'error', 'createdAt', 'updatedAt'])

export type PaymentWebhookEventScalarFieldEnum = z.infer<typeof PaymentWebhookEventScalarFieldEnumSchema>;

// File: ChapterScalarFieldEnum.schema.ts

export const ChapterScalarFieldEnumSchema = z.enum(['id', 'courseId', 'title', 'order', 'createdAt', 'updatedAt'])

export type ChapterScalarFieldEnum = z.infer<typeof ChapterScalarFieldEnumSchema>;

// File: LessonScalarFieldEnum.schema.ts

export const LessonScalarFieldEnumSchema = z.enum(['id', 'chapterId', 'slug', 'title', 'content', 'isFreePreview', 'order', 'status', 'videoProvider', 'videoUrl', 'videoDuration', 'aiPrompt', 'aiContext', 'createdAt', 'updatedAt'])

export type LessonScalarFieldEnum = z.infer<typeof LessonScalarFieldEnumSchema>;

// File: LessonProgressScalarFieldEnum.schema.ts

export const LessonProgressScalarFieldEnumSchema = z.enum(['id', 'userId', 'lessonId', 'completedAt', 'createdAt', 'updatedAt'])

export type LessonProgressScalarFieldEnum = z.infer<typeof LessonProgressScalarFieldEnumSchema>;

// File: SidebarGroupScalarFieldEnum.schema.ts

export const SidebarGroupScalarFieldEnumSchema = z.enum(['id', 'title', 'order', 'isCollapsed', 'createdAt', 'updatedAt'])

export type SidebarGroupScalarFieldEnum = z.infer<typeof SidebarGroupScalarFieldEnumSchema>;

// File: SidebarGroupItemScalarFieldEnum.schema.ts

export const SidebarGroupItemScalarFieldEnumSchema = z.enum(['id', 'groupId', 'menuItemId', 'order', 'createdAt', 'updatedAt'])

export type SidebarGroupItemScalarFieldEnum = z.infer<typeof SidebarGroupItemScalarFieldEnumSchema>;

// File: PluginContentScalarFieldEnum.schema.ts

export const PluginContentScalarFieldEnumSchema = z.enum(['id', 'pluginId', 'type', 'title', 'body', 'authorId', 'createdAt', 'updatedAt'])

export type PluginContentScalarFieldEnum = z.infer<typeof PluginContentScalarFieldEnumSchema>;

// File: AssignmentSubmissionScalarFieldEnum.schema.ts

export const AssignmentSubmissionScalarFieldEnumSchema = z.enum(['id', 'pluginContentId', 'userId', 'content', 'contentFormat', 'wordCount', 'status', 'revisionNumber', 'isLate', 'submittedAt', 'createdAt', 'updatedAt'])

export type AssignmentSubmissionScalarFieldEnum = z.infer<typeof AssignmentSubmissionScalarFieldEnumSchema>;

// File: AssignmentUploadIntentScalarFieldEnum.schema.ts

export const AssignmentUploadIntentScalarFieldEnumSchema = z.enum(['id', 'pluginContentId', 'submissionId', 'userId', 'filename', 'mimeType', 'size', 'storageKey', 'status', 'expiresAt', 'cleanupClaimedAt', 'createdAt'])

export type AssignmentUploadIntentScalarFieldEnum = z.infer<typeof AssignmentUploadIntentScalarFieldEnumSchema>;

// File: AssignmentAttachmentScalarFieldEnum.schema.ts

export const AssignmentAttachmentScalarFieldEnumSchema = z.enum(['id', 'submissionId', 'filename', 'mimeType', 'size', 'storageKey', 'createdAt'])

export type AssignmentAttachmentScalarFieldEnum = z.infer<typeof AssignmentAttachmentScalarFieldEnumSchema>;

// File: AssignmentReviewScalarFieldEnum.schema.ts

export const AssignmentReviewScalarFieldEnumSchema = z.enum(['id', 'submissionId', 'reviewerId', 'feedback', 'score', 'letterGrade', 'reviewedAt', 'createdAt'])

export type AssignmentReviewScalarFieldEnum = z.infer<typeof AssignmentReviewScalarFieldEnumSchema>;

// File: AssignmentDraftScalarFieldEnum.schema.ts

export const AssignmentDraftScalarFieldEnumSchema = z.enum(['id', 'pluginContentId', 'userId', 'content', 'contentFormat', 'revision', 'createdAt', 'updatedAt'])

export type AssignmentDraftScalarFieldEnum = z.infer<typeof AssignmentDraftScalarFieldEnumSchema>;

// File: CourseReviewScalarFieldEnum.schema.ts

export const CourseReviewScalarFieldEnumSchema = z.enum(['id', 'courseId', 'userId', 'rating', 'content', 'isVisible', 'helpfulCount', 'replyContent', 'replyAt', 'createdAt', 'updatedAt'])

export type CourseReviewScalarFieldEnum = z.infer<typeof CourseReviewScalarFieldEnumSchema>;

// File: CourseOnboardingSurveyResponseScalarFieldEnum.schema.ts

export const CourseOnboardingSurveyResponseScalarFieldEnumSchema = z.enum(['id', 'userId', 'courseId', 'goals', 'purchaseFactors', 'hesitation', 'alternatives', 'discoverySource', 'discoverySourceOther', 'createdAt', 'updatedAt'])

export type CourseOnboardingSurveyResponseScalarFieldEnum = z.infer<typeof CourseOnboardingSurveyResponseScalarFieldEnumSchema>;

// File: ReviewHelpfulScalarFieldEnum.schema.ts

export const ReviewHelpfulScalarFieldEnumSchema = z.enum(['id', 'reviewId', 'userId', 'createdAt'])

export type ReviewHelpfulScalarFieldEnum = z.infer<typeof ReviewHelpfulScalarFieldEnumSchema>;

// File: ReviewReportScalarFieldEnum.schema.ts

export const ReviewReportScalarFieldEnumSchema = z.enum(['id', 'reviewId', 'userId', 'reason', 'createdAt'])

export type ReviewReportScalarFieldEnum = z.infer<typeof ReviewReportScalarFieldEnumSchema>;

// File: LessonCommentScalarFieldEnum.schema.ts

export const LessonCommentScalarFieldEnumSchema = z.enum(['id', 'lessonId', 'userId', 'content', 'isAnonymous', 'isRead', 'deletedAt', 'deletedBy', 'createdAt', 'updatedAt'])

export type LessonCommentScalarFieldEnum = z.infer<typeof LessonCommentScalarFieldEnumSchema>;

// File: QuizAttemptScalarFieldEnum.schema.ts

export const QuizAttemptScalarFieldEnumSchema = z.enum(['id', 'userId', 'pluginContentId', 'answers', 'score', 'passed', 'timeTakenSeconds', 'startedAt', 'submittedAt'])

export type QuizAttemptScalarFieldEnum = z.infer<typeof QuizAttemptScalarFieldEnumSchema>;

// File: McpConnectionScalarFieldEnum.schema.ts

export const McpConnectionScalarFieldEnumSchema = z.enum(['id', 'userId', 'clientName', 'authorizedAt', 'lastUsedAt', 'revokedAt'])

export type McpConnectionScalarFieldEnum = z.infer<typeof McpConnectionScalarFieldEnumSchema>;

// File: StudioFolderScalarFieldEnum.schema.ts

export const StudioFolderScalarFieldEnumSchema = z.enum(['id', 'name', 'order', 'isCollapsed', 'createdAt', 'updatedAt'])

export type StudioFolderScalarFieldEnum = z.infer<typeof StudioFolderScalarFieldEnumSchema>;

// File: StudioFolderItemScalarFieldEnum.schema.ts

export const StudioFolderItemScalarFieldEnumSchema = z.enum(['id', 'folderId', 'moduleId', 'order', 'createdAt', 'updatedAt'])

export type StudioFolderItemScalarFieldEnum = z.infer<typeof StudioFolderItemScalarFieldEnumSchema>;

// File: StudioFolderCollapseStateScalarFieldEnum.schema.ts

export const StudioFolderCollapseStateScalarFieldEnumSchema = z.enum(['id', 'userId', 'folderId', 'isCollapsed', 'createdAt', 'updatedAt'])

export type StudioFolderCollapseStateScalarFieldEnum = z.infer<typeof StudioFolderCollapseStateScalarFieldEnumSchema>;

// File: BundleScalarFieldEnum.schema.ts

export const BundleScalarFieldEnumSchema = z.enum(['id', 'slug', 'title', 'description', 'priceTwd', 'status', 'createdAt', 'updatedAt'])

export type BundleScalarFieldEnum = z.infer<typeof BundleScalarFieldEnumSchema>;

// File: BundleCourseScalarFieldEnum.schema.ts

export const BundleCourseScalarFieldEnumSchema = z.enum(['id', 'bundleId', 'courseId', 'order'])

export type BundleCourseScalarFieldEnum = z.infer<typeof BundleCourseScalarFieldEnumSchema>;

// File: CouponScalarFieldEnum.schema.ts

export const CouponScalarFieldEnumSchema = z.enum(['id', 'code', 'discountType', 'amountOff', 'percentOff', 'maxDiscountAmount', 'maxRedemptions', 'timesRedeemed', 'active', 'startsAt', 'expiresAt', 'createdAt', 'updatedAt'])

export type CouponScalarFieldEnum = z.infer<typeof CouponScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInput = z.infer<typeof JsonNullValueInputSchema>;

// File: NullableJsonNullValueInput.schema.ts

export const NullableJsonNullValueInputSchema = z.enum(['DbNull', 'JsonNull'])

export type NullableJsonNullValueInput = z.infer<typeof NullableJsonNullValueInputSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilter = z.infer<typeof JsonNullValueFilterSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseType = z.infer<typeof PurchaseTypeSchema>;

// File: NotificationType.schema.ts

export const NotificationTypeSchema = z.enum(['WELCOME', 'APP_UPDATE'])

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// File: NotificationTarget.schema.ts

export const NotificationTargetSchema = z.enum(['IN_APP', 'EMAIL'])

export type NotificationTarget = z.infer<typeof NotificationTargetSchema>;

// File: OrderStatus.schema.ts

export const OrderStatusSchema = z.enum(['pending', 'paid', 'refunded'])

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// File: GithubKitGrantStatus.schema.ts

export const GithubKitGrantStatusSchema = z.enum(['invited', 'accepted', 'revoked', 'failed'])

export type GithubKitGrantStatus = z.infer<typeof GithubKitGrantStatusSchema>;

// File: BuyerDeploymentTier.schema.ts

export const BuyerDeploymentTierSchema = z.enum(['self_hosted', 'managed', 'advanced'])

export type BuyerDeploymentTier = z.infer<typeof BuyerDeploymentTierSchema>;

// File: BuyerDeploymentStatus.schema.ts

export const BuyerDeploymentStatusSchema = z.enum(['provisioning', 'live', 'building', 'error'])

export type BuyerDeploymentStatus = z.infer<typeof BuyerDeploymentStatusSchema>;

// File: SupportTicketChannel.schema.ts

export const SupportTicketChannelSchema = z.enum(['WEB_WIDGET', 'LINE', 'TELEGRAM'])

export type SupportTicketChannel = z.infer<typeof SupportTicketChannelSchema>;

// File: SupportTicketStatus.schema.ts

export const SupportTicketStatusSchema = z.enum(['OPEN', 'AI_SUGGESTED_RESOLVED', 'RESOLVED', 'ESCALATED'])

export type SupportTicketStatus = z.infer<typeof SupportTicketStatusSchema>;

// File: SupportTicketResolvedBy.schema.ts

export const SupportTicketResolvedBySchema = z.enum(['BUYER_CONFIRMED', 'AUTO_TIMEOUT'])

export type SupportTicketResolvedBy = z.infer<typeof SupportTicketResolvedBySchema>;

// File: PublishStatus.schema.ts

export const PublishStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

export type PublishStatus = z.infer<typeof PublishStatusSchema>;

// File: SubscriptionInterval.schema.ts

export const SubscriptionIntervalSchema = z.enum(['MONTH', 'YEAR'])

export type SubscriptionInterval = z.infer<typeof SubscriptionIntervalSchema>;

// File: CourseSubscriptionStatus.schema.ts

export const CourseSubscriptionStatusSchema = z.enum(['PENDING', 'ACTIVE', 'CANCELED'])

export type CourseSubscriptionStatus = z.infer<typeof CourseSubscriptionStatusSchema>;

// File: PaymentWebhookEventStatus.schema.ts

export const PaymentWebhookEventStatusSchema = z.enum(['PROCESSING', 'COMPLETED', 'FAILED'])

export type PaymentWebhookEventStatus = z.infer<typeof PaymentWebhookEventStatusSchema>;

// File: VideoProvider.schema.ts

export const VideoProviderSchema = z.enum(['BUNNY', 'YOUTUBE', 'VIMEO', 'CUSTOM_MP4', 'HLS'])

export type VideoProvider = z.infer<typeof VideoProviderSchema>;

// File: User.schema.ts

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullish(),
  locale: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
  lastActiveOrganizationId: z.string().nullish(),
});

export type UserType = z.infer<typeof UserSchema>;


// File: Session.schema.ts

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.string(),
  impersonatedBy: z.string().nullish(),
  activeOrganizationId: z.string().nullish(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionType = z.infer<typeof SessionSchema>;


// File: Account.schema.ts

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  password: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountType = z.infer<typeof AccountSchema>;


// File: Verification.schema.ts

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export type VerificationType = z.infer<typeof VerificationSchema>;


// File: Passkey.schema.ts

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullish(),
  aaguid: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export type PasskeyType = z.infer<typeof PasskeySchema>;


// File: TwoFactor.schema.ts

export const TwoFactorSchema = z.object({
  id: z.string(),
  secret: z.string(),
  backupCodes: z.string(),
  verified: z.boolean(),
  userId: z.string(),
  failedVerificationCount: z.number().int().nullish(),
  lockedUntil: z.date().nullish(),
});

export type TwoFactorType = z.infer<typeof TwoFactorSchema>;


// File: Organization.schema.ts

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullish(),
  logo: z.string().nullish(),
  createdAt: z.date(),
  metadata: z.string().nullish(),
  paymentsCustomerId: z.string().nullish(),
});

export type OrganizationType = z.infer<typeof OrganizationSchema>;


// File: Member.schema.ts

export const MemberSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string(),
  role: z.string(),
  createdAt: z.date(),
});

export type MemberType = z.infer<typeof MemberSchema>;


// File: Invitation.schema.ts

export const InvitationSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  email: z.string(),
  role: z.string().nullish(),
  status: z.string(),
  expiresAt: z.date(),
  inviterId: z.string(),
  createdAt: z.date(),
});

export type InvitationType = z.infer<typeof InvitationSchema>;


// File: Purchase.schema.ts

export const PurchaseSchema = z.object({
  id: z.string(),
  organizationId: z.string().nullish(),
  userId: z.string().nullish(),
  type: PurchaseTypeSchema,
  customerId: z.string(),
  subscriptionId: z.string().nullish(),
  priceId: z.string(),
  status: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseModel = z.infer<typeof PurchaseSchema>;

// File: Notification.schema.ts

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default({}),
  link: z.string().nullish(),
  read: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NotificationModel = z.infer<typeof NotificationSchema>;

// File: UserNotificationPreference.schema.ts

export const UserNotificationPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  target: NotificationTargetSchema,
  createdAt: z.date(),
});

export type UserNotificationPreferenceType = z.infer<typeof UserNotificationPreferenceSchema>;


// File: LoginAttempt.schema.ts

export const LoginAttemptSchema = z.object({
  id: z.string(),
  email: z.string(),
  ipAddress: z.string(),
  success: z.boolean(),
  userAgent: z.string().nullish(),
  createdAt: z.date(),
});

export type LoginAttemptType = z.infer<typeof LoginAttemptSchema>;


// File: AdminLog.schema.ts

export const AdminLogSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  action: z.string(),
  targetType: z.string().nullish(),
  targetId: z.string().nullish(),
  details: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  ipAddress: z.string().nullish(),
  createdAt: z.date(),
});

export type AdminLogType = z.infer<typeof AdminLogSchema>;


// File: Order.schema.ts

export const OrderSchema = z.object({
  id: z.string(),
  orderNo: z.string(),
  userId: z.string(),
  sku: z.string(),
  amount: z.number().int(),
  currency: z.string().default("TWD"),
  status: OrderStatusSchema.default("pending"),
  paymentGateway: z.string().default("payuni"),
  gatewayTradeNo: z.string().nullish(),
  courseAccess: z.boolean(),
  kitClaimEligible: z.boolean(),
  paidAt: z.date().nullish(),
  refundedAt: z.date().nullish(),
  invoiceType: z.string().nullish(),
  invoiceCarrierType: z.string().nullish(),
  invoiceCarrierId: z.string().nullish(),
  invoiceTaxId: z.string().nullish(),
  invoiceTitle: z.string().nullish(),
  invoiceAddress: z.string().nullish(),
  invoiceLoveCode: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OrderType = z.infer<typeof OrderSchema>;


// File: GithubKitGrant.schema.ts

export const GithubKitGrantSchema = z.object({
  id: z.string(),
  userId: z.string(),
  githubUserId: z.string(),
  githubLogin: z.string(),
  org: z.string(),
  repo: z.string(),
  permission: z.string().default("pull"),
  status: GithubKitGrantStatusSchema,
  orderNo: z.string().nullish(),
  acceptedAt: z.date().nullish(),
  revokedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GithubKitGrantType = z.infer<typeof GithubKitGrantSchema>;


// File: SiteSetting.schema.ts

export const SiteSettingSchema = z.object({
  id: z.string(),
  ciphertext: z.string(),
  updatedAt: z.date(),
  updatedBy: z.string().nullish(),
});

export type SiteSettingType = z.infer<typeof SiteSettingSchema>;


// File: BuyerDeployment.schema.ts

export const BuyerDeploymentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tier: BuyerDeploymentTierSchema,
  coolifyServerId: z.string().nullish(),
  coolifyAppId: z.string().nullish(),
  publicUrl: z.string(),
  customDomain: z.string().nullish(),
  status: BuyerDeploymentStatusSchema.default("provisioning"),
  lastDeployedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BuyerDeploymentType = z.infer<typeof BuyerDeploymentSchema>;


// File: SupportTicket.schema.ts

export const SupportTicketSchema = z.object({
  id: z.string(),
  buyerDeploymentId: z.string().nullish(),
  userId: z.string(),
  chatwootConversationId: z.number().int(),
  channel: SupportTicketChannelSchema,
  status: SupportTicketStatusSchema.default("OPEN"),
  aiSuggestedResolvedAt: z.date().nullish(),
  resolvedAt: z.date().nullish(),
  resolvedBy: SupportTicketResolvedBySchema.nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SupportTicketType = z.infer<typeof SupportTicketSchema>;


// File: Course.schema.ts

export const CourseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  status: PublishStatusSchema.default("PUBLISHED"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseType = z.infer<typeof CourseSchema>;


// File: CourseInstructor.schema.ts

export const CourseInstructorSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  userId: z.string(),
  createdById: z.string(),
  createdAt: z.date(),
});

export type CourseInstructorType = z.infer<typeof CourseInstructorSchema>;


// File: CourseVideoWatermarkSetting.schema.ts

export const CourseVideoWatermarkSettingSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  enabled: z.boolean(),
  showEmail: z.boolean().default(true),
  showCourseTitle: z.boolean().default(true),
  showTimestamp: z.boolean().default(true),
  emailDisplayMode: z.string().default("FULL"),
  opacityPercent: z.number().int().default(18),
  textSize: z.string().default("MD"),
  movementMode: z.string().default("STANDARD"),
  moveIntervalSec: z.number().int().default(12),
  tamperPauseEnabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseVideoWatermarkSettingType = z.infer<typeof CourseVideoWatermarkSettingSchema>;


// File: CourseSubscriptionPlan.schema.ts

export const CourseSubscriptionPlanSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  label: z.string(),
  interval: SubscriptionIntervalSchema,
  price: z.number().int(),
  sku: z.string(),
  enabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseSubscriptionPlanType = z.infer<typeof CourseSubscriptionPlanSchema>;


// File: CourseSubscription.schema.ts

export const CourseSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  planId: z.string(),
  status: CourseSubscriptionStatusSchema.default("PENDING"),
  gatewayTradeNo: z.string(),
  gatewaySubscriptionId: z.string().nullish(),
  interval: SubscriptionIntervalSchema,
  pricePerPeriod: z.number().int(),
  paidPeriods: z.number().int(),
  currentPeriodEnd: z.date().nullish(),
  lastPaymentAt: z.date().nullish(),
  canceledAt: z.date().nullish(),
  invoiceType: z.string().nullish(),
  invoiceCarrierType: z.string().nullish(),
  invoiceCarrierId: z.string().nullish(),
  invoiceTaxId: z.string().nullish(),
  invoiceTitle: z.string().nullish(),
  invoiceAddress: z.string().nullish(),
  invoiceLoveCode: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseSubscriptionType = z.infer<typeof CourseSubscriptionSchema>;


// File: CourseInvite.schema.ts

export const CourseInviteSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  tokenHash: z.string(),
  email: z.string().nullish(),
  maxUses: z.number().int().nullish(),
  usedCount: z.number().int(),
  expiresAt: z.date().nullish(),
  active: z.boolean().default(true),
  createdBy: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseInviteType = z.infer<typeof CourseInviteSchema>;


// File: CourseInviteRedemption.schema.ts

export const CourseInviteRedemptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  inviteId: z.string(),
  redeemedAt: z.date(),
});

export type CourseInviteRedemptionType = z.infer<typeof CourseInviteRedemptionSchema>;


// File: Invoice.schema.ts

export const InvoiceSchema = z.object({
  id: z.string(),
  orderId: z.string().nullish(),
  subscriptionId: z.string().nullish(),
  periodNumber: z.number().int().nullish(),
  provider: z.string(),
  status: z.string().default("PENDING"),
  invoiceNumber: z.string().nullish(),
  randomCode: z.string().nullish(),
  invoiceDate: z.date().nullish(),
  amount: z.number().int(),
  allowanceTotal: z.number().int(),
  failReason: z.string().nullish(),
  attentionReason: z.string().nullish(),
  rawResponse: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InvoiceType = z.infer<typeof InvoiceSchema>;


// File: PaymentWebhookEvent.schema.ts

export const PaymentWebhookEventSchema = z.object({
  id: z.string(),
  gateway: z.string(),
  eventId: z.string(),
  eventType: z.string(),
  status: PaymentWebhookEventStatusSchema.default("PROCESSING"),
  payload: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  error: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentWebhookEventType = z.infer<typeof PaymentWebhookEventSchema>;


// File: Chapter.schema.ts

export const ChapterSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ChapterType = z.infer<typeof ChapterSchema>;


// File: Lesson.schema.ts

export const LessonSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string().nullish(),
  isFreePreview: z.boolean(),
  order: z.number().int(),
  status: PublishStatusSchema.default("PUBLISHED"),
  videoProvider: VideoProviderSchema.nullish(),
  videoUrl: z.string().nullish(),
  videoDuration: z.string().nullish(),
  aiPrompt: z.string().nullish(),
  aiContext: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LessonType = z.infer<typeof LessonSchema>;


// File: LessonProgress.schema.ts

export const LessonProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lessonId: z.string(),
  completedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LessonProgressType = z.infer<typeof LessonProgressSchema>;


// File: SidebarGroup.schema.ts

export const SidebarGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int(),
  isCollapsed: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SidebarGroupType = z.infer<typeof SidebarGroupSchema>;


// File: SidebarGroupItem.schema.ts

export const SidebarGroupItemSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  menuItemId: z.string(),
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SidebarGroupItemType = z.infer<typeof SidebarGroupItemSchema>;


// File: PluginContent.schema.ts

export const PluginContentSchema = z.object({
  id: z.string(),
  pluginId: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  authorId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PluginContentType = z.infer<typeof PluginContentSchema>;


// File: AssignmentSubmission.schema.ts

export const AssignmentSubmissionSchema = z.object({
  id: z.string(),
  pluginContentId: z.string(),
  userId: z.string(),
  content: z.string().nullish(),
  contentFormat: z.string().nullish(),
  wordCount: z.number().int().nullish(),
  status: z.string().default("DRAFT"),
  revisionNumber: z.number().int().default(1),
  isLate: z.boolean(),
  submittedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AssignmentSubmissionType = z.infer<typeof AssignmentSubmissionSchema>;


// File: AssignmentUploadIntent.schema.ts

export const AssignmentUploadIntentSchema = z.object({
  id: z.string(),
  pluginContentId: z.string(),
  submissionId: z.string(),
  userId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  storageKey: z.string(),
  status: z.string().default("PENDING"),
  expiresAt: z.date(),
  cleanupClaimedAt: z.date().nullish(),
  createdAt: z.date(),
});

export type AssignmentUploadIntentType = z.infer<typeof AssignmentUploadIntentSchema>;


// File: AssignmentAttachment.schema.ts

export const AssignmentAttachmentSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  storageKey: z.string(),
  createdAt: z.date(),
});

export type AssignmentAttachmentType = z.infer<typeof AssignmentAttachmentSchema>;


// File: AssignmentReview.schema.ts

export const AssignmentReviewSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  reviewerId: z.string(),
  feedback: z.string().nullish(),
  score: z.number().int().nullish(),
  letterGrade: z.string().nullish(),
  reviewedAt: z.date(),
  createdAt: z.date(),
});

export type AssignmentReviewType = z.infer<typeof AssignmentReviewSchema>;


// File: AssignmentDraft.schema.ts

export const AssignmentDraftSchema = z.object({
  id: z.string(),
  pluginContentId: z.string(),
  userId: z.string(),
  content: z.string().nullish(),
  contentFormat: z.string().nullish(),
  revision: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AssignmentDraftType = z.infer<typeof AssignmentDraftSchema>;


// File: CourseReview.schema.ts

export const CourseReviewSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  userId: z.string(),
  rating: z.number().int(),
  content: z.string().nullish(),
  isVisible: z.boolean().default(true),
  helpfulCount: z.number().int(),
  replyContent: z.string().nullish(),
  replyAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseReviewType = z.infer<typeof CourseReviewSchema>;


// File: CourseOnboardingSurveyResponse.schema.ts

export const CourseOnboardingSurveyResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  goals: z.array(z.string()),
  purchaseFactors: z.array(z.string()),
  hesitation: z.string().nullish(),
  alternatives: z.string().nullish(),
  discoverySource: z.string().nullish(),
  discoverySourceOther: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CourseOnboardingSurveyResponseType = z.infer<typeof CourseOnboardingSurveyResponseSchema>;


// File: ReviewHelpful.schema.ts

export const ReviewHelpfulSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  userId: z.string(),
  createdAt: z.date(),
});

export type ReviewHelpfulType = z.infer<typeof ReviewHelpfulSchema>;


// File: ReviewReport.schema.ts

export const ReviewReportSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  userId: z.string(),
  reason: z.string(),
  createdAt: z.date(),
});

export type ReviewReportType = z.infer<typeof ReviewReportSchema>;


// File: LessonComment.schema.ts

export const LessonCommentSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  userId: z.string(),
  content: z.string(),
  isAnonymous: z.boolean(),
  isRead: z.boolean(),
  deletedAt: z.date().nullish(),
  deletedBy: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LessonCommentType = z.infer<typeof LessonCommentSchema>;


// File: QuizAttempt.schema.ts

export const QuizAttemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  pluginContentId: z.string(),
  answers: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  score: z.number().int(),
  passed: z.boolean(),
  timeTakenSeconds: z.number().int().nullish(),
  startedAt: z.date(),
  submittedAt: z.date(),
});

export type QuizAttemptType = z.infer<typeof QuizAttemptSchema>;


// File: McpConnection.schema.ts

export const McpConnectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  clientName: z.string(),
  authorizedAt: z.date(),
  lastUsedAt: z.date().nullish(),
  revokedAt: z.date().nullish(),
});

export type McpConnectionType = z.infer<typeof McpConnectionSchema>;


// File: StudioFolder.schema.ts

export const StudioFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number().int(),
  isCollapsed: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StudioFolderType = z.infer<typeof StudioFolderSchema>;


// File: StudioFolderItem.schema.ts

export const StudioFolderItemSchema = z.object({
  id: z.string(),
  folderId: z.string(),
  moduleId: z.string(),
  order: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StudioFolderItemType = z.infer<typeof StudioFolderItemSchema>;


// File: StudioFolderCollapseState.schema.ts

export const StudioFolderCollapseStateSchema = z.object({
  id: z.string(),
  userId: z.string(),
  folderId: z.string(),
  isCollapsed: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type StudioFolderCollapseStateType = z.infer<typeof StudioFolderCollapseStateSchema>;


// File: Bundle.schema.ts

export const BundleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  priceTwd: z.number().int(),
  status: z.string().default("draft"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BundleType = z.infer<typeof BundleSchema>;


// File: BundleCourse.schema.ts

export const BundleCourseSchema = z.object({
  id: z.string(),
  bundleId: z.string(),
  courseId: z.string(),
  order: z.number().int(),
});

export type BundleCourseType = z.infer<typeof BundleCourseSchema>;


// File: Coupon.schema.ts

export const CouponSchema = z.object({
  id: z.string(),
  code: z.string(),
  discountType: z.string(),
  amountOff: z.number().int().nullish(),
  percentOff: z.number().int().nullish(),
  maxDiscountAmount: z.number().int().nullish(),
  maxRedemptions: z.number().int().nullish(),
  timesRedeemed: z.number().int(),
  active: z.boolean().default(true),
  startsAt: z.date().nullish(),
  expiresAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CouponType = z.infer<typeof CouponSchema>;

