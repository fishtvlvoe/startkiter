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

// File: OrderScalarFieldEnum.schema.ts

export const OrderScalarFieldEnumSchema = z.enum(['id', 'orderNo', 'userId', 'sku', 'amount', 'currency', 'status', 'paymentGateway', 'gatewayTradeNo', 'courseAccess', 'kitClaimEligible', 'paidAt', 'refundedAt', 'createdAt', 'updatedAt'])

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

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInput = z.infer<typeof JsonNullValueInputSchema>;

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

