import { getSession } from "@auth/lib/server";
import { checkPermission } from "@startkiter/permissions";
import { Card } from "@startkiter/ui";
import { requireGlobalAdmin } from "../../../../../../../lib/admin-access";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getInvoiceSettings, writeInvoiceSettings } from "../../../../../../../lib/invoice-settings";

async function saveInvoiceSettings(formData: FormData) {
	"use server";

	const session = await getSession();
	if (!session || !checkPermission({ user: session.user }, "admin.access")) redirect("/login");

	const result = await writeInvoiceSettings({
		actorUserId: session.user.id,
		patch: {
			provider: formData.get("provider") === "ezpay" ? "ezpay" : "ecpay",
			merchantId: String(formData.get("merchantId") ?? ""),
			hashKey: String(formData.get("hashKey") ?? ""),
			hashIV: String(formData.get("hashIV") ?? ""),
			testMode: formData.get("testMode") === "on",
			autoIssueEnabled: formData.get("autoIssueEnabled") === "on",
			einvoiceEnabled: formData.get("einvoiceEnabled") === "on",
			sellerName: String(formData.get("sellerName") ?? ""),
			sellerTaxId: String(formData.get("sellerTaxId") ?? ""),
		},
	});

	if (!result.ok) redirect(`/admin/settings/einvoice?error=${encodeURIComponent(result.error)}`);
	revalidatePath("/admin/settings/einvoice");
	redirect("/admin/settings/einvoice?saved=1");
}

export async function generateMetadata() {
	return { title: "台灣統一發票設定" };
}

export default async function EInvoiceSettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; error?: string }>;
}) {
	await requireGlobalAdmin();
	const settings = await getInvoiceSettings();
	const params = await searchParams;

	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h2 className="text-xl font-semibold">台灣統一發票</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					金鑰只存加密 SiteSetting；電子發票總開關預設關閉，不會影響既有付款流程。
				</p>
				{params.saved === "1" && <p className="mt-4 text-sm text-green-600">設定已儲存。</p>}
				{params.error && <p className="mt-4 text-sm text-red-600">儲存失敗：{params.error}</p>}
			</Card>

			<Card className="p-6">
				<form action={saveInvoiceSettings} className="space-y-5">
					<div className="grid gap-2">
						<label htmlFor="provider">發票供應商</label>
						<select id="provider" name="provider" defaultValue={settings.provider} className="rounded-md border p-2">
							<option value="ecpay">綠界 ECPay</option>
							<option value="ezpay">藍新 ezPay</option>
						</select>
					</div>
					<div className="grid gap-2">
						<label htmlFor="sellerName">賣方名稱</label>
						<input id="sellerName" name="sellerName" defaultValue={settings.sellerName} required className="rounded-md border p-2" />
					</div>
					<div className="grid gap-2">
						<label htmlFor="sellerTaxId">賣方統編</label>
						<input id="sellerTaxId" name="sellerTaxId" defaultValue={settings.sellerTaxId} inputMode="numeric" required className="rounded-md border p-2" />
					</div>
					<div className="grid gap-2">
						<label htmlFor="merchantId">商店代號</label>
						<input id="merchantId" name="merchantId" defaultValue={settings.merchantId} required className="rounded-md border p-2" />
					</div>
					<div className="grid gap-2">
						<label htmlFor="hashKey">Hash Key</label>
						<input id="hashKey" name="hashKey" type="password" placeholder="留白表示維持原金鑰" autoComplete="new-password" className="rounded-md border p-2" />
					</div>
					<div className="grid gap-2">
						<label htmlFor="hashIV">Hash IV</label>
						<input id="hashIV" name="hashIV" type="password" placeholder="留白表示維持原金鑰" autoComplete="new-password" className="rounded-md border p-2" />
					</div>
					<div className="space-y-3">
						<label className="flex items-center gap-2"><input type="checkbox" name="testMode" defaultChecked={settings.testMode} /> 測試模式</label>
						<label className="flex items-center gap-2"><input type="checkbox" name="autoIssueEnabled" defaultChecked={settings.autoIssueEnabled} /> 付款成功後自動開立</label>
						<label className="flex items-center gap-2"><input type="checkbox" name="einvoiceEnabled" defaultChecked={settings.einvoiceEnabled} /> 啟用電子發票</label>
					</div>
					<button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">儲存設定</button>
				</form>
			</Card>
		</div>
	);
}
