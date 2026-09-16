"use server";

import { db, type Prisma } from "@startkiter/database";
import { isOperator } from "@startkiter/permissions";
import { renderCampaignHtml, requestImmediateSend, sendEmail } from "@startkiter/newsletter";
import { getSession } from "@auth/lib/server";
import { redirect } from "next/navigation";

import type {
	ComposerActionResult,
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

export async function renderNewsletterPreview(contentJson: NewsletterContentJson) {
	await requireComposerAccess();
	return renderCampaignHtml(contentJson, { mode: "preview" });
}

export async function createNewsletterDraft(): Promise<void> {
	const session = await requireComposerAccess();
	const campaign = await db.newsletterCampaign.create({
		data: {
			name: "未命名電子報",
			subject: "",
			contentJson: { blocks: [] },
			createdById: session.user.id,
		},
		select: { id: true },
	});
	redirect(`/admin/newsletter/${campaign.id}`);
}

export async function autosaveNewsletterDraft(input: NewsletterAutosaveInput): Promise<ComposerActionResult> {
	const session = await requireComposerAccess();
	const rendered = renderCampaignHtml(input.contentJson, { mode: "preview" });
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
		select: { id: true, subject: true, contentJson: true },
	});
	if (!campaign) return { ok: false, error: "找不到電子報草稿" };

	const rendered = renderCampaignHtml(asContentJson(campaign.contentJson), { mode: "test" });
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
		select: { id: true, contentJson: true },
	});
	if (!campaign) return { ok: false, error: "找不到電子報草稿" };

	const rendered = renderCampaignHtml(asContentJson(campaign.contentJson), { mode: "send" });
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
		await requestImmediateSend(campaign.id);
		return { ok: true };
	} catch (error) {
		return { ok: false, error: error instanceof Error ? error.message : "電子報發送失敗" };
	}
}
