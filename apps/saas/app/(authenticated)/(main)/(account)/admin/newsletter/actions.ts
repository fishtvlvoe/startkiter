"use server";

import { db, type Prisma } from "@startkiter/database";
import { isOperator } from "@startkiter/permissions";
import {
	assertPromotionalCampaignCanActivate,
	assertPromoAudienceLocked,
	estimateAudience,
	parseSegmentJson,
	PromoAudienceLockError,
	renderCampaignHtml,
	requestImmediateSend,
	sendEmail,
	type SegmentJson,
} from "@startkiter/newsletter";
import { normalizeEmail } from "@startkiter/newsletter/lib/audience";
import { getSession } from "@auth/lib/server";
import { redirect } from "next/navigation";

import { getNewsletterSiteSettings } from "../../../../../../lib/newsletter-settings";
import { getBaseUrl } from "../../../../../../modules/shared/lib/base-url";

import type {
	ComposerActionResult,
	NewsletterAudiencePrepareInput,
	NewsletterAudiencePrepareResult,
	NewsletterAutosaveInput,
	NewsletterSendInput,
	NewsletterTestSendInput,
} from "./composer";
import type { NewsletterContentJson } from "./content-types";

const STAFF_ROLES = new Set(["ADMIN", "EDITOR", "INSTRUCTOR"]);

async function requireComposerAccess() {
	const session = await getSession();
	if (!session) redirect("/login");

	const role = String(session.user.role ?? "").toUpperCase();
	if (!isOperator(session.user, process.env.ADMIN_EMAIL) && !STAFF_ROLES.has(role)) {
		redirect("/");
	}
	return session;
}

function asContentJson(value: Prisma.JsonValue): NewsletterContentJson {
	if (value && typeof value === "object" && !Array.isArray(value) && "blocks" in value && Array.isArray(value.blocks)) {
		return value as unknown as NewsletterContentJson;
	}
	return { blocks: [] };
}

function asSegmentJson(value: Prisma.JsonValue | null | undefined): SegmentJson {
	return parseSegmentJson(value);
}

export async function renderNewsletterPreview(contentJson: NewsletterContentJson) {
	const session = await requireComposerAccess();
	const settings = await getNewsletterSiteSettings();
	return renderCampaignHtml(contentJson, {
		mode: "preview",
		appUrl: getBaseUrl(),
		recipientUserId: session.user.id,
		recipientEmail: session.user.email,
		senderPhysicalAddress: settings.senderPhysicalAddress,
		unsubscribeScope: "all",
	});
}

export async function createNewsletterDraft(): Promise<void> {
	const session = await requireComposerAccess();
	const campaign = await db.newsletterCampaign.create({
		data: {
			name: "未命名電子報",
			subject: "",
			type: "PROMO",
			contentJson: { blocks: [] },
			segmentJson: {
				preset: "manual",
				mode: "AND",
				rules: [{ field: "marketingConsent", value: true }],
				manualEmails: [],
			},
			createdById: session.user.id,
		},
		select: { id: true },
	});
	redirect(`/admin/newsletter/${campaign.id}`);
}

export async function autosaveNewsletterDraft(input: NewsletterAutosaveInput): Promise<ComposerActionResult> {
	const session = await requireComposerAccess();
	const settings = await getNewsletterSiteSettings();
	const rendered = renderCampaignHtml(input.contentJson, {
		mode: "preview",
		appUrl: getBaseUrl(),
		recipientUserId: session.user.id,
		recipientEmail: session.user.email,
		senderPhysicalAddress: settings.senderPhysicalAddress,
		unsubscribeScope: "all",
	});
	const result = await db.newsletterCampaign.updateMany({
		where: { id: input.campaignId, createdById: session.user.id, status: "DRAFT" },
		data: {
			subject: input.subject.trim(),
			preheader: input.preheader.trim() || null,
			contentJson: input.contentJson as unknown as Prisma.InputJsonValue,
			bodyHtml: rendered.html,
			bodyText: rendered.text,
		},
	});
	return result.count === 1 ? { ok: true } : { ok: false, error: "草稿不存在或已不在編輯狀態" };
}

export async function prepareNewsletterAudience(
	input: NewsletterAudiencePrepareInput,
): Promise<NewsletterAudiencePrepareResult> {
	const session = await requireComposerAccess();
	const campaign = await db.newsletterCampaign.findFirst({
		where: { id: input.campaignId, createdById: session.user.id, status: "DRAFT" },
		select: { id: true, type: true },
	});
	if (!campaign) return { ok: false, error: "找不到電子報草稿" };

	const segment: SegmentJson =
		input.preset === "manual"
			? {
					preset: "manual",
					mode: "AND",
					manualEmails: (input.manualEmails || []).map((email) => email.trim().toLowerCase()).filter(Boolean),
					rules: campaign.type === "PROMO" ? [{ field: "marketingConsent", value: true }] : [],
				}
			: {
					preset: "all",
					mode: "AND",
					rules: campaign.type === "PROMO" ? [{ field: "marketingConsent", value: true }] : [],
				};

	try {
		assertPromoAudienceLocked({ type: campaign.type, segment });
	} catch (error) {
		if (error instanceof PromoAudienceLockError) {
			return { ok: false, error: error.message };
		}
		throw error;
	}

	if (input.preset === "manual" && !(segment.manualEmails || []).length) {
		return { ok: false, error: "請至少填一個手動收件信箱" };
	}

	const estimate = await estimateAudience({
		type: campaign.type,
		segment,
	});

	await db.$transaction(async (tx) => {
		await tx.newsletterRecipient.deleteMany({
			where: { campaignId: campaign.id, isTest: false, status: "PENDING" },
		});
		const recipients = estimate.recipients ?? [];
		if (recipients.length) {
			const audienceEmails = new Set(recipients.map((recipient) => normalizeEmail(recipient.email)));
			const existingTestRecipients = await tx.newsletterRecipient.findMany({
				where: { campaignId: campaign.id, isTest: true },
				select: { id: true, toEmail: true },
			});
			const overlappingTestIds = existingTestRecipients
				.filter((recipient) => audienceEmails.has(normalizeEmail(recipient.toEmail)))
				.map((recipient) => recipient.id);
			if (overlappingTestIds.length) {
				// The schema has one (campaignId, toEmail) row, so promote an overlapping test row by replacement.
				await tx.newsletterRecipient.deleteMany({ where: { id: { in: overlappingTestIds } } });
			}
			await tx.newsletterRecipient.createMany({
				data: recipients.map((recipient) => ({
					campaignId: campaign.id,
					userId: recipient.id,
					toEmail: recipient.email,
					toName: recipient.name,
					status: "PENDING",
					isTest: false,
				})),
				skipDuplicates: true,
			});
		}
		await tx.newsletterCampaign.update({
			where: { id: campaign.id },
			data: {
				segmentJson: segment as unknown as Prisma.InputJsonValue,
				totalRecipients: estimate.sendable,
			},
		});
	});

	return { ok: true, recipientEstimate: estimate.sendable };
}

export async function sendNewsletterTest(input: NewsletterTestSendInput): Promise<ComposerActionResult> {
	const session = await requireComposerAccess();
	const recipient = input.recipient.trim().toLowerCase();
	const user = await db.user.findUnique({
		where: { email: recipient },
		select: { id: true, email: true, name: true, role: true },
	});
	const role = String(user?.role ?? "").toUpperCase();
	if (!user || (!STAFF_ROLES.has(role) && !isOperator(user, process.env.ADMIN_EMAIL))) {
		return { ok: false, error: "測試信只能寄給內部帳號" };
	}

	const campaign = await db.newsletterCampaign.findFirst({
		where: { id: input.campaignId, createdById: session.user.id },
		select: { id: true, subject: true, type: true, contentJson: true },
	});
	if (!campaign) return { ok: false, error: "找不到電子報草稿" };

	const settings = await getNewsletterSiteSettings();
	try {
		assertPromotionalCampaignCanActivate({
			type: campaign.type,
			senderPhysicalAddress: settings.senderPhysicalAddress,
		});
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : "寄件人實體地址尚未設定" };
	}
	const rendered = renderCampaignHtml(asContentJson(campaign.contentJson), {
		mode: "test",
		appUrl: getBaseUrl(),
		recipientUserId: user.id,
		recipientEmail: user.email,
		senderPhysicalAddress: settings.senderPhysicalAddress,
		unsubscribeScope: campaign.type === "PROMO" ? "marketing" : "general",
	});
	if (rendered.isOversized) return { ok: false, error: rendered.warnings[0] ?? "HTML 超過 102KB" };
	const sent = await sendEmail({
		to: user.email,
		subject: campaign.subject || "StartKiter 測試電子報",
		html: rendered.html,
		text: rendered.text,
	});
	if (!sent) return { ok: false, error: "Email provider 拒絕寄送" };

	await db.newsletterRecipient.upsert({
		where: { campaignId_toEmail: { campaignId: campaign.id, toEmail: user.email } },
		create: {
			campaignId: campaign.id,
			userId: user.id,
			toEmail: user.email,
			toName: user.name,
			status: "SENT",
			isTest: true,
			sentAt: new Date(),
		},
		update: { status: "SENT", isTest: true, sentAt: new Date(), errorMessage: null },
	});
	return { ok: true };
}

export async function sendNewsletter(input: NewsletterSendInput): Promise<ComposerActionResult> {
	const session = await requireComposerAccess();
	const campaign = await db.newsletterCampaign.findFirst({
		where: { id: input.campaignId, createdById: session.user.id },
		select: { id: true, type: true, contentJson: true, segmentJson: true },
	});
	if (!campaign) return { ok: false, error: "找不到電子報草稿" };

	const settings = await getNewsletterSiteSettings();
	try {
		assertPromotionalCampaignCanActivate({
			type: campaign.type,
			senderPhysicalAddress: settings.senderPhysicalAddress,
		});
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : "寄件人實體地址尚未設定" };
	}

	const segment = asSegmentJson(campaign.segmentJson);
	try {
		assertPromoAudienceLocked({ type: campaign.type, segment });
	} catch (error) {
		if (error instanceof PromoAudienceLockError) {
			return { ok: false, error: error.message };
		}
		throw error;
	}

	const rendered = renderCampaignHtml(asContentJson(campaign.contentJson), {
		mode: "send",
		appUrl: getBaseUrl(),
		senderPhysicalAddress: settings.senderPhysicalAddress,
		unsubscribeScope: campaign.type === "PROMO" ? "marketing" : "general",
	});
	if (rendered.isOversized) return { ok: false, error: rendered.warnings[0] ?? "HTML 超過 102KB" };
	const recipientCount = await db.newsletterRecipient.count({
		where: { campaignId: campaign.id, status: "PENDING", isTest: false },
	});
	if (recipientCount === 0) return { ok: false, error: "沒有可寄送的收件人" };

	await db.newsletterCampaign.updateMany({
		where: { id: campaign.id, createdById: session.user.id, status: "DRAFT" },
		data: { bodyHtml: rendered.html, bodyText: rendered.text },
	});
	try {
		await requestImmediateSend(campaign.id, {
			senderPhysicalAddress: settings.senderPhysicalAddress,
			appUrl: getBaseUrl(),
		});
		return { ok: true };
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : "電子報發送失敗" };
	}
}
