import { db } from "@startkiter/database";
import { verifyUnsubscribeToken, type UnsubscribeScope } from "@startkiter/newsletter";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
	return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function scopeAllows(scope: UnsubscribeScope, target: "all" | "marketing" | "general"): boolean {
	return scope === "all" || scope === target;
}

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
	const params = await searchParams;
	const userId = first(params.userId);
	const email = first(params.email);
	const token = first(params.token);
	const scopeValue = first(params.scope);
	const scope: UnsubscribeScope = scopeValue === "marketing" || scopeValue === "general" ? scopeValue : "all";
	const verified = Boolean(userId && email && token && verifyUnsubscribeToken({ userId, email, scope, token }));
	const user = verified
		? await db.user.findUnique({
				where: { id: userId },
				select: { email: true, generalEmailConsent: true, marketingConsent: true, unsubscribedAt: true },
			}).catch(() => null)
		: null;

	return (
		<main className="min-h-screen px-4 py-16">
			<section className="mx-auto max-w-xl space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
				<h1 className="text-2xl font-semibold">電子報訂閱偏好</h1>
				{verified && user ? (
					<>
						<p className="text-sm text-muted-foreground">
							目前信箱：<span className="font-medium text-foreground">{user.email}</span>
						</p>
						<p className="text-sm text-muted-foreground">交易通知不受電子報退訂影響。</p>
						<form action="/api/unsubscribe" method="post" className="space-y-4">
							<input type="hidden" name="userId" value={userId} />
							<input type="hidden" name="email" value={email} />
							<input type="hidden" name="token" value={token} />
							<input type="hidden" name="scope" value={scope} />
							<input type="hidden" name="preferences" value="true" />
							<label className="flex items-center justify-between gap-4 rounded-lg border p-4">
								<span>促銷電子報</span>
								<input
									type="checkbox"
									name="marketingConsent"
									value="true"
									defaultChecked={user.marketingConsent === true}
									disabled={!scopeAllows(scope, "marketing")}
								/>
							</label>
							<label className="flex items-center justify-between gap-4 rounded-lg border p-4">
								<span>一般電子報</span>
								<input
									type="checkbox"
									name="generalEmailConsent"
									value="true"
									defaultChecked={user.generalEmailConsent === true}
									disabled={!scopeAllows(scope, "general")}
								/>
							</label>
							<label className="flex items-center justify-between gap-4 rounded-lg border p-4">
								<span>全部退訂</span>
								<input type="checkbox" name="unsubscribeAll" value="true" defaultChecked={user.unsubscribedAt !== null} disabled={!scopeAllows(scope, "all")} />
							</label>
							<button type="submit" className="w-full rounded-full bg-primary px-4 py-2 text-primary-foreground">
								儲存偏好
							</button>
						</form>
					</>
				) : (
					<p className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">
						退訂連結缺少必要資訊或已無法驗證。
					</p>
				)}
			</section>
		</main>
	);
}
