import { db } from "@startkiter/database";
import { isOperator } from "@startkiter/permissions";
import { getSession } from "@auth/lib/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createNewsletterDraft } from "./actions";

function formatDate(value: Date): string {
	return value.toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" });
}

export const metadata = { title: "電子報" };

export default async function NewsletterListPage() {
	const session = await getSession();
	if (!session) redirect("/login");

	const canSeeAll = isOperator(session.user, process.env.ADMIN_EMAIL);
	const campaigns = await db.newsletterCampaign.findMany({
		where: canSeeAll ? undefined : { createdById: session.user.id },
		orderBy: { updatedAt: "desc" },
		select: {
			id: true,
			name: true,
			subject: true,
			type: true,
			status: true,
			updatedAt: true,
			totalRecipients: true,
			_count: { select: { recipients: true } },
		},
	});

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6" data-testid="newsletter-list-page">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">電子報</h1>
					<p className="mt-1 text-sm text-muted-foreground">建立、預覽並管理一般與促銷電子報。</p>
				</div>
				<form action={createNewsletterDraft}>
					<button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">新增電子報</button>
				</form>
			</div>

			{campaigns.length === 0 ? (
				<div className="rounded-xl border p-8 text-center text-sm text-muted-foreground">尚無電子報草稿。</div>
			) : (
				<div className="overflow-x-auto rounded-xl border">
					<table className="w-full text-left text-sm">
						<thead className="bg-muted/30"><tr><th className="p-4">名稱</th><th className="p-4">類型</th><th className="p-4">狀態</th><th className="p-4">收件人</th><th className="p-4">最後更新</th></tr></thead>
						<tbody>
							{campaigns.map((campaign) => (
								<tr key={campaign.id} className="border-t">
									<td className="p-4"><Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/admin/newsletter/${campaign.id}`}>{campaign.name}</Link><p className="mt-1 text-xs text-muted-foreground">{campaign.subject || "（未填主旨）"}</p></td>
									<td className="p-4">{campaign.type === "PROMO" ? "促銷" : "一般"}</td>
									<td className="p-4">{campaign.status}</td>
									<td className="p-4">{campaign._count.recipients || campaign.totalRecipients}</td>
									<td className="p-4 text-muted-foreground">{formatDate(campaign.updatedAt)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
