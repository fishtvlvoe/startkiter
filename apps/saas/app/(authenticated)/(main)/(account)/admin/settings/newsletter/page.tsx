import { getSession } from "@auth/lib/server";
import { checkPermission } from "@startkiter/permissions";
import { Card } from "@startkiter/ui";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireGlobalAdmin } from "../../../../../../../lib/admin-access";
import { getNewsletterSiteSettings, writeNewsletterSiteSettings } from "../../../../../../../lib/newsletter-settings";

async function saveNewsletterSettings(formData: FormData) {
	"use server";

	const session = await getSession();
	if (!session || !checkPermission({ user: session.user }, "admin.access")) redirect("/login");

	const result = await writeNewsletterSiteSettings({
		actorUserId: session.user.id,
		settings: { senderPhysicalAddress: String(formData.get("senderPhysicalAddress") ?? "").trim() },
	});
	if (!result.ok) redirect(`/admin/settings/newsletter?error=${encodeURIComponent(result.error)}`);
	revalidatePath("/admin/settings/newsletter");
	redirect("/admin/settings/newsletter?saved=1");
}

export async function generateMetadata() {
	return { title: "電子報設定" };
}

export default async function NewsletterSettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; error?: string }>;
}) {
	await requireGlobalAdmin();
	const settings = await getNewsletterSiteSettings();
	const params = await searchParams;

	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h1 className="text-xl font-semibold">電子報設定</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					促銷電子報啟動前必須填寫寄件人的實體地址。設定會以加密 SiteSetting 儲存。
				</p>
				{params.saved === "1" && <p className="mt-4 text-sm text-green-600">設定已儲存。</p>}
				{params.error && <p className="mt-4 text-sm text-red-600">儲存失敗：{params.error}</p>}
			</Card>
			<Card className="p-6">
				<form action={saveNewsletterSettings} className="space-y-5">
					<div className="grid gap-2">
						<label htmlFor="senderPhysicalAddress">寄件人實體地址</label>
						<textarea
							id="senderPhysicalAddress"
							name="senderPhysicalAddress"
							defaultValue={settings.senderPhysicalAddress}
							required
							rows={3}
							className="rounded-md border p-2"
						/>
					</div>
					<button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
						儲存設定
					</button>
				</form>
			</Card>
		</div>
	);
}
