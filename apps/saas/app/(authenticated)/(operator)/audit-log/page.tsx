import { getSession } from "@auth/lib/server";
import { isOperator } from "@startkiter/permissions";
import { db } from "@startkiter/database";
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from "@startkiter/ui";
import { redirect } from "next/navigation";

type AuditLogPageProps = {
	searchParams: Promise<{
		email?: string;
		ip?: string;
		admin?: string;
		action?: string;
	}>;
};

function queryValue(value: string | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

function formatDate(value: Date): string {
	return value.toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "medium" });
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isOperator(session.user, process.env.ADMIN_EMAIL)) redirect("/");

	const params = await searchParams;
	const email = queryValue(params.email);
	const ip = queryValue(params.ip);
	const admin = queryValue(params.admin);
	const action = queryValue(params.action);

	const [loginAttempts, adminLogs] = await Promise.all([
		db.loginAttempt.findMany({
			where: {
				...(email ? { email: { contains: email, mode: "insensitive" } } : {}),
				...(ip ? { ipAddress: { contains: ip } } : {}),
			},
			orderBy: { createdAt: "desc" },
			take: 100,
		}),
		db.adminLog.findMany({
			where: {
				...(admin ? { admin: { email: { contains: admin, mode: "insensitive" } } } : {}),
				...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
				...(ip ? { ipAddress: { contains: ip } } : {}),
			},
			include: { admin: { select: { email: true, name: true } } },
			orderBy: { createdAt: "desc" },
			take: 100,
		}),
	]);

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6" data-testid="audit-log-page">
			<Card>
				<CardHeader>
					<CardTitle>稽核紀錄</CardTitle>
					<p className="text-sm text-muted-foreground">查詢登入嘗試與高風險管理員操作。只保留最近 100 筆。</p>
				</CardHeader>
				<CardContent>
					<form className="grid gap-4 md:grid-cols-4" method="get">
						<label className="grid gap-1 text-sm"><Label htmlFor="audit-email">登入 email</Label><Input id="audit-email" name="email" defaultValue={email} /></label>
						<label className="grid gap-1 text-sm"><Label htmlFor="audit-ip">IP</Label><Input id="audit-ip" name="ip" defaultValue={ip} /></label>
						<label className="grid gap-1 text-sm"><Label htmlFor="audit-admin">管理員 email</Label><Input id="audit-admin" name="admin" defaultValue={admin} /></label>
						<label className="grid gap-1 text-sm"><Label htmlFor="audit-action">操作類型</Label><Input id="audit-action" name="action" placeholder="REFUND_ORDER" defaultValue={action} /></label>
						<div className="md:col-span-4"><button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">查詢</button></div>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>登入嘗試（{loginAttempts.length}）</CardTitle></CardHeader>
				<CardContent>
					<div className="space-y-2" data-testid="login-attempt-list">
						{loginAttempts.map((attempt) => (
							<article className="rounded-xl border p-3 text-sm" key={attempt.id}>
								<div className="flex flex-wrap justify-between gap-2"><span>{attempt.email}</span><span className={attempt.success ? "text-emerald-600" : "text-destructive"}>{attempt.success ? "成功" : "失敗"}</span></div>
								<p className="text-muted-foreground">{attempt.ipAddress} · {formatDate(attempt.createdAt)} · {attempt.userAgent ?? "無 user-agent"}</p>
							</article>
						))}
						{loginAttempts.length === 0 && <p className="text-sm text-muted-foreground">沒有符合條件的登入紀錄。</p>}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>管理員操作（{adminLogs.length}）</CardTitle></CardHeader>
				<CardContent>
					<div className="space-y-2" data-testid="admin-log-list">
						{adminLogs.map((log) => (
							<article className="rounded-xl border p-3 text-sm" key={log.id}>
								<div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{log.action}</span><span>{log.admin.email}</span></div>
								<p>{log.targetType ?? "Target"}: {log.targetId ?? "-"} · {log.ipAddress ?? "未知 IP"} · {formatDate(log.createdAt)}</p>
								{log.details && <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-2 text-xs">{JSON.stringify(log.details)}</pre>}
							</article>
						))}
						{adminLogs.length === 0 && <p className="text-sm text-muted-foreground">沒有符合條件的管理員操作。</p>}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
