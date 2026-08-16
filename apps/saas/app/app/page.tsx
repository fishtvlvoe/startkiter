import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { getMessagesForLocale } from "@startkiter/i18n";
import { Button, Card } from "@startkiter/ui";

import { userHasCourseAccess } from "../../lib/course-access";
import { getRequestLocale } from "../../lib/request-locale";
import { AppShell } from "../components/app-shell";
import { SignOutButton } from "./sign-out-button";

type AccountMessages = {
	brand: string;
	account: {
		title: string;
		courseActive: string;
		courseInactive: string;
		enterCourse: string;
		buyCourse: string;
	};
};

export default async function AccountPage() {
	const session = await auth.api.getSession({ headers: new Headers(await headers()) });

	if (!session) {
		redirect("/login");
	}

	const entitled = await userHasCourseAccess(session.user.id);
	const locale = await getRequestLocale();
	const messages = await getMessagesForLocale<AccountMessages>(locale, "saas");

	return (
		<main className="app-main-root">
			<AppShell
				brand={messages.brand}
				email={session.user.email}
				name={session.user.name}
				locale={locale}
				current="app"
				heading={
					<>
						<p className="ds-muted" style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
							{messages.account.title}
						</p>
						<h1 style={{ margin: "0.2rem 0 0", fontSize: "1.5rem", fontWeight: 600 }}>開始</h1>
						<p className="ds-muted" style={{ margin: "0.25rem 0 0" }}>
							{entitled ? "課程已開通。課與終身代碼包同一筆訂單。" : messages.account.courseInactive}
						</p>
					</>
				}
			>
				<section className="stats-grid">
					<Card className="ds-card stat-card">
						<p className="ds-muted" style={{ margin: 0, fontSize: "0.8rem" }}>
							課程
						</p>
						<p style={{ margin: "0.35rem 0 0", fontSize: "1.75rem", fontWeight: 600 }}>
							{entitled ? "已開通" : "尚未購買"}
						</p>
						<p className="ds-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>
							一次買斷，觀看權限有效
						</p>
					</Card>
					<Card className="ds-card stat-card">
						<p className="ds-muted" style={{ margin: 0, fontSize: "0.8rem" }}>
							訂單
						</p>
						<p style={{ margin: "0.35rem 0 0", fontSize: "1.75rem", fontWeight: 600 }}>NT$8,800</p>
						<p className="ds-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>
							PAYUNi · 買斷
						</p>
					</Card>
					<Card className="ds-card stat-card">
						<p className="ds-muted" style={{ margin: 0, fontSize: "0.8rem" }}>
							GitHub kit
						</p>
						<p style={{ margin: "0.35rem 0 0", fontSize: "1.75rem", fontWeight: 600 }}>
							{entitled ? "可領取" : "未開通"}
						</p>
						<p className="ds-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>
							退款後資格取消
						</p>
					</Card>
				</section>

				<Card className="ds-card" style={{ marginTop: "1rem", padding: "1.25rem 1.5rem" }}>
					<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
						<div>
							<h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>繼續上課</h2>
							<p className="ds-muted" style={{ margin: "0.3rem 0 0", fontSize: "0.9rem" }}>
								從課程目錄接著看。
							</p>
						</div>
						<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
							<Button asChild variant="primary" className="ds-btn" data-variant="primary" data-size="md">
								<Link href="/course">{messages.account.enterCourse}</Link>
							</Button>
							{!entitled ? (
								<Button asChild variant="outline" className="ds-btn" data-variant="outline" data-size="md">
									<Link href="/checkout">{messages.account.buyCourse}</Link>
								</Button>
							) : null}
							<SignOutButton />
						</div>
					</div>
				</Card>
			</AppShell>
		</main>
	);
}
