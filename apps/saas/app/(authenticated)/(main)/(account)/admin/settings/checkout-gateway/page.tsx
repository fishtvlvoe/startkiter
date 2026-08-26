import { getSession } from "@auth/lib/server";
import { checkPermission } from "@startkiter/permissions";
import { Card } from "@startkiter/ui";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireGlobalAdmin } from "../../../../../../../lib/admin-access";
import { getCheckoutGatewaySettings, writeCheckoutGatewaySettings } from "../../../../../../../lib/checkout-gateway-settings";

async function saveCheckoutGatewaySettings(formData: FormData) {
	"use server";

	const session = await getSession();
	if (!session || !checkPermission({ user: session.user }, "admin.access")) redirect("/login");

	const result = await writeCheckoutGatewaySettings({
		actorUserId: session.user.id,
		patch: {
			gateway: formData.get("gateway") === "stripe" ? "stripe" : formData.get("gateway") === "shopline" ? "shopline" : "payuni",
			shoplineMerchantId: String(formData.get("shoplineMerchantId") ?? ""),
			shoplineApiKey: String(formData.get("shoplineApiKey") ?? ""),
			shoplineClientKey: String(formData.get("shoplineClientKey") ?? ""),
			shoplineSignKey: String(formData.get("shoplineSignKey") ?? ""),
			shoplineTestMode: formData.get("shoplineTestMode") === "on",
			stripeSecretKey: String(formData.get("stripeSecretKey") ?? ""),
			stripeWebhookSecret: String(formData.get("stripeWebhookSecret") ?? ""),
		},
	});

	if (!result.ok) redirect(`/admin/settings/checkout-gateway?error=${encodeURIComponent(result.error)}`);
	revalidatePath("/admin/settings/checkout-gateway");
	redirect("/admin/settings/checkout-gateway?saved=1");
}

export async function generateMetadata() {
	return { title: "結帳金流設定" };
}

export default async function CheckoutGatewaySettingsPage({
	searchParams,
}: {
	searchParams: Promise<{ saved?: string; error?: string }>;
}) {
	await requireGlobalAdmin();
	const settings = await getCheckoutGatewaySettings();
	const params = await searchParams;

	return (
		<div className="space-y-6">
			<Card className="p-6">
				<h2 className="text-xl font-semibold">一次性結帳金流</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					同一時間只啟用一個金流。金鑰存於加密 SiteSetting；Shopline 與 Stripe 預設使用測試模式。
				</p>
				<p className="mt-2 text-sm">目前金流：{settings.gateway}；Shopline：{settings.shoplineConfigured ? "已設定" : "未設定"}；Stripe：{settings.stripeConfigured ? "已設定" : "未設定"}</p>
				{params.saved === "1" && <p className="mt-4 text-sm text-green-600">設定已儲存。</p>}
				{params.error && <p className="mt-4 text-sm text-red-600">儲存失敗：{params.error}</p>}
			</Card>

			<Card className="p-6">
				<form action={saveCheckoutGatewaySettings} className="space-y-5">
					<div className="grid gap-2">
						<label htmlFor="gateway">啟用金流</label>
						<select id="gateway" name="gateway" defaultValue={settings.gateway} className="rounded-md border p-2">
							<option value="payuni">PAYUNi</option>
							<option value="shopline">Shopline Payments</option>
							<option value="stripe">Stripe</option>
						</select>
					</div>
					<h3 className="pt-2 font-semibold">Shopline Payments</h3>
					{[
						["shoplineMerchantId", "Merchant ID"],
						["shoplineApiKey", "API Key"],
						["shoplineClientKey", "Client Key"],
						["shoplineSignKey", "Webhook Sign Key"],
					].map(([name, label]) => (
						<div className="grid gap-2" key={name}>
							<label htmlFor={name}>{label}</label>
							<input id={name} name={name} type="password" placeholder="留白表示維持原金鑰" autoComplete="new-password" className="rounded-md border p-2" />
						</div>
					))}
					<label className="flex items-center gap-2"><input type="checkbox" name="shoplineTestMode" defaultChecked={settings.testMode} /> Shopline 測試模式</label>
					<h3 className="pt-2 font-semibold">Stripe</h3>
					{[
						["stripeSecretKey", "Secret Key"],
						["stripeWebhookSecret", "Webhook Signing Secret"],
					].map(([name, label]) => (
						<div className="grid gap-2" key={name}>
							<label htmlFor={name}>{label}</label>
							<input id={name} name={name} type="password" placeholder="留白表示維持原金鑰" autoComplete="new-password" className="rounded-md border p-2" />
						</div>
					))}
					<button type="submit" className="rounded-md bg-primary px-4 py-2 text-primary-foreground">儲存設定</button>
				</form>
			</Card>
		</div>
	);
}
