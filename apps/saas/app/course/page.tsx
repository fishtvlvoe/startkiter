import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { getLesson, listLessons } from "@startkiter/course";
import { getMessagesForLocale } from "@startkiter/i18n";
import { Button } from "@startkiter/ui";

import { userHasCourseAccess } from "../../lib/course-access";
import { shouldShowOperatorSettingsLink } from "../../lib/operator";
import { getRequestLocale } from "../../lib/request-locale";
import { AppShell } from "../components/app-shell";
import { CourseWorkspace } from "./course-workspace";
import { DemoGrantButton } from "./demo-grant-button";
import { KitClaimPanel } from "./kit-claim-panel";
import { LineCommunityPanel } from "./line-community-panel";

export const dynamic = "force-dynamic";

type NavMessages = {
	brand: string;
};

export default async function CourseIndexPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login");
	}

	const entitled = await userHasCourseAccess(session.user.id);
	const demoEnabled = process.env.DEMO_GRANT_COURSE === "true";
	const lessons = listLessons();
	const current = entitled ? getLesson(lessons[0]?.id ?? "") : null;
	const locale = await getRequestLocale();
	const messages = await getMessagesForLocale<NavMessages>(locale, "saas");
	const showOperatorSettings = shouldShowOperatorSettingsLink(
		true,
		session.user.email,
		process.env.ADMIN_EMAIL,
	);

	return (
		<main className="app-main-root">
			<AppShell
				brand={messages.brand}
				email={session.user.email}
				name={session.user.name}
				locale={locale}
				current="course"
				showOperatorSettings={showOperatorSettings}
				heading={
					<>
						<p className="ds-muted" style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
							課程
						</p>
						<h1 style={{ margin: "0.2rem 0 0", fontSize: "1.5rem", fontWeight: 600 }}>觀看開站包</h1>
						<p className="ds-muted" style={{ margin: "0.25rem 0 0" }}>
							{entitled ? "買斷後可看全部單元。進度 1 / 3。" : "買斷後可看全部單元。未購買前看不到影片內容。"}
						</p>
					</>
				}
			>
				{!entitled ? (
					<div className="stack" style={{ marginBottom: "1rem" }}>
						<p>你還沒有購買開站包，所以課程內容暫時鎖住。</p>
						{demoEnabled ? (
							<div className="callout">
								<p style={{ margin: "0 0 12px" }}>測試站 Demo：可一鍵假裝已付款，方便先踩流程。</p>
								<DemoGrantButton />
							</div>
						) : (
							<Button asChild variant="primary" className="ds-btn" data-variant="primary" data-size="md">
								<Link href="/checkout">去購買 NT$8,800</Link>
							</Button>
						)}
					</div>
				) : null}

				<CourseWorkspace
					lessons={lessons}
					current={current ?? undefined}
					entitled={entitled}
					player={
						entitled ? (
							<div className="player-stage" data-slot="player" aria-label="播放區塊佔位">
								<div style={{ textAlign: "center" }}>
									<div className="player-play" aria-hidden="true">
										▶
									</div>
									<p style={{ margin: "0.85rem 0 0", fontSize: "0.875rem", opacity: 0.8 }}>
										選一個單元開始看。正式環境接 Bunny。
									</p>
								</div>
							</div>
						) : (
							<div className="player-stage" data-slot="player" aria-label="課程未開通">
								<p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.8 }}>購買後才能播放</p>
							</div>
						)
					}
				/>

				{entitled ? (
					<div style={{ marginTop: "1rem" }} className="stack">
						<KitClaimPanel />
						<LineCommunityPanel />
					</div>
				) : null}
			</AppShell>
		</main>
	);
}
