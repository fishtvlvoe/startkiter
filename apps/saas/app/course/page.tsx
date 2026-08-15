import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { listLessons } from "@startkiter/course";

import { SiteNav } from "../components/site-nav";
import { userHasCourseAccess } from "../../lib/course-access";
import { DemoGrantButton } from "./demo-grant-button";
import { KitClaimPanel } from "./kit-claim-panel";
import { LineCommunityPanel } from "./line-community-panel";

export default async function CourseIndexPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login");
	}

	const entitled = await userHasCourseAccess(session.user.id);
	const demoEnabled = process.env.DEMO_GRANT_COURSE === "true";
	const lessons = entitled ? listLessons() : [];

	return (
		<main>
			<SiteNav signedIn email={session.user.email} hasPurchase={entitled} />

			<section className="panel stack">
				<div>
					<h1>課程</h1>
					<p className="muted">買斷後可看全部單元。未購買前看不到影片內容。</p>
				</div>

				{!entitled ? (
					<div className="stack">
						<p>你還沒有購買開站包，所以課程內容暫時鎖住。</p>
						{demoEnabled ? (
							<div className="callout">
								<p style={{ margin: "0 0 12px" }}>測試站 Demo：可一鍵假裝已付款，方便先踩流程。</p>
								<DemoGrantButton />
							</div>
						) : (
							<div className="actions">
								<Link className="button" href="/checkout">
									去購買 NT$8,800
								</Link>
							</div>
						)}
					</div>
				) : (
					<>
						<ul className="lesson-list">
							{lessons.map((lesson) => (
								<li key={lesson.id}>
									<Link href={`/course/${lesson.id}`}>
										{lesson.order}. {lesson.title}
									</Link>
								</li>
							))}
						</ul>
						<KitClaimPanel />
						<LineCommunityPanel />
					</>
				)}
			</section>
		</main>
	);
}
