import {
	applyUnsubscribe,
	assertEmailConsent,
	verifyUnsubscribeToken,
	type UnsubscribeScope,
} from "@startkiter/newsletter";
import { db } from "@startkiter/database";
import { Button } from "@startkiter/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@startkiter/ui/components/card";
import { redirect } from "next/navigation";

function firstString(
	value: string | string[] | undefined,
): string {
	return typeof value === "string" ? value : "";
}

/** GET 只讀，不寫 DB——供測試與頁面共用。 */
export async function loadUnsubscribePageState(params: {
	email: string;
	token: string;
	status: string;
	campaignId: string;
}) {
	const verified =
		params.email && params.token
			? verifyUnsubscribeToken({ token: params.token, email: params.email })
			: { ok: false as const };

	const user =
		verified.ok && verified.userId
			? await db.user.findUnique({
					where: { id: verified.userId },
					select: {
						email: true,
						generalEmailConsent: true,
						marketingConsent: true,
						unsubscribedAt: true,
					},
				})
			: null;

	return { verified, user, status: params.status, email: params.email, campaignId: params.campaignId };
}

export async function submitUnsubscribeAction(formData: FormData) {
	"use server";

	const email = String(formData.get("email") || "");
	const token = String(formData.get("token") || "");
	const campaignId = String(formData.get("campaignId") || "") || null;
	const scopeOverride = String(formData.get("scope") || "") as UnsubscribeScope | "";
	const verified = verifyUnsubscribeToken({ token, email });
	if (!verified.ok || !verified.userId || !verified.scope) {
		redirect("/unsubscribe?status=invalid");
	}

	const scope =
		scopeOverride && ["all", "marketing", "general"].includes(scopeOverride)
			? scopeOverride
			: verified.scope;

	// scope 必須與 token 簽章一致；若 UI 送出不同 scope，重新驗算（防竄改）
	if (scope !== verified.scope) {
		redirect("/unsubscribe?status=invalid");
	}

	await applyUnsubscribe({
		userId: verified.userId,
		email,
		scope,
		campaignId,
		source: "unsubscribe_page",
	});

	redirect("/unsubscribe?status=done");
}

export default async function UnsubscribePage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const email = firstString(params.email);
	const token = firstString(params.token);
	const status = firstString(params.status);
	const campaignId = firstString(params.campaignId);
	const state = await loadUnsubscribePageState({
		email,
		token,
		status,
		campaignId,
	});

	const { verified, user } = state;
	const signedScope = verified.ok && verified.scope ? verified.scope : null;

	return (
		<main className="min-h-screen bg-muted/30 px-4 py-16">
			<Card className="mx-auto max-w-xl border bg-background shadow-sm">
				<CardHeader>
					<CardTitle className="text-xl">電子報訂閱偏好</CardTitle>
				</CardHeader>
				<CardContent className="space-y-5 text-sm text-muted-foreground">
					{status === "done" ? (
						<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
							已更新你的訂閱偏好。交易通知（購買確認、密碼重設）不受影響。
						</div>
					) : null}
					{status === "invalid" ? (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
							退訂連結驗證失敗，請回到原信件重新點擊連結。
						</div>
					) : null}
					{!verified.ok && !status ? (
						<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
							退訂連結缺少必要資訊或已無法驗證。
						</div>
					) : null}
					{verified.ok ? (
						<>
							<p>
								目前信箱：
								<span className="font-medium text-foreground">{user?.email || email}</span>
							</p>
							<p>這個連結只會更新原信件簽章授權的訂閱範圍。交易通知仍會在必要時寄送。</p>
							{signedScope ? (
								<p>
									授權範圍：
									<span className="font-medium text-foreground">
										{signedScope === "all"
											? "全部電子報"
											: signedScope === "marketing"
												? "促銷電子報"
												: "一般電子報"}
									</span>
								</p>
							) : null}
							<form action={submitUnsubscribeAction} className="space-y-3">
								<input type="hidden" name="email" value={email} />
								<input type="hidden" name="token" value={token} />
								<input type="hidden" name="campaignId" value={campaignId} />
								<input type="hidden" name="scope" value={signedScope ?? "all"} />
								<Button type="submit" className="w-full">
									確認退訂
								</Button>
							</form>
							{signedScope === "general" ? (
								<p className="text-xs">
									僅退訂一般電子報不會取消促銷同意，也不會影響交易信。
								</p>
							) : null}
						</>
					) : null}
				</CardContent>
			</Card>
		</main>
	);
}

/** 測試用：general 退訂後 transactional 仍允許 */
export async function assertTransactionalStillAllowedAfterGeneralUnsub(userId: string) {
	return assertEmailConsent(userId, "transactional");
}
