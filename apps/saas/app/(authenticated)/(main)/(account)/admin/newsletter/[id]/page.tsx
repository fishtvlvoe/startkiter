import { db } from "@startkiter/database";
import { isOperator } from "@startkiter/permissions";
import { getSession } from "@auth/lib/server";
import { notFound, redirect } from "next/navigation";

import { autosaveNewsletterDraft, renderNewsletterPreview, sendNewsletter, sendNewsletterTest } from "../actions";
import { renderCampaignHtml } from "@startkiter/newsletter";
import NewsletterComposer from "../composer";
import type { NewsletterContentJson } from "../content-types";

function asContentJson(value: unknown): NewsletterContentJson {
	if (value && typeof value === "object" && !Array.isArray(value) && "blocks" in value && Array.isArray(value.blocks)) {
		return value as NewsletterContentJson;
	}
	return { blocks: [] };
}

export default async function NewsletterComposerPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getSession();
	if (!session) redirect("/login");
	const canSeeAll = isOperator(session.user, process.env.ADMIN_EMAIL);
	const { id } = await params;
	const campaign = await db.newsletterCampaign.findFirst({
		where: canSeeAll ? { id } : { id, createdById: session.user.id },
		select: {
			id: true,
			name: true,
			type: true,
			subject: true,
			preheader: true,
			contentJson: true,
			senderName: true,
			replyTo: true,
		},
	});
	if (!campaign) notFound();

	const recipientEstimate = await db.newsletterRecipient.count({
		where: { campaignId: campaign.id, status: "PENDING", isTest: false },
	});
	const contentJson = asContentJson(campaign.contentJson);
	const initialPreview = renderCampaignHtml(contentJson, { mode: "preview" });

	return (
		<div className="mx-auto max-w-7xl p-6">
			<NewsletterComposer
				campaign={{
					id: campaign.id,
					name: campaign.name,
					type: campaign.type,
					subject: campaign.subject,
					preheader: campaign.preheader,
					contentJson,
					senderName: campaign.senderName,
					replyTo: campaign.replyTo,
				}}
				recipientEstimate={recipientEstimate}
				onAutosave={autosaveNewsletterDraft}
				onSendTest={sendNewsletterTest}
				onSend={sendNewsletter}
				onRenderPreview={renderNewsletterPreview}
				initialPreview={initialPreview}
			/>
		</div>
	);
}
