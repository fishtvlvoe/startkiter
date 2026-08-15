import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { listLessons } from "@startkiter/course";

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
			<nav className="nav" aria-label="主要導覽">
				<strong>
					<Link href="/">開站包</Link>
				</strong>
				<div className="nav-links">
					<Link href="/checkout">結帳</Link>
					<span className="muted">{session.user.email}</span>
				</div>
			</nav>

			<section className="panel">
				<h1>課程模組</h1>
				<p className="muted">權限讀 Order.courseAccess。沒付費就看不到媒體。</p>

				{!entitled ? (
					<>
						<p>目前沒有課程權限（courseAccess=false 或尚未購買）。</p>
						{demoEnabled ? (
							<>
								<p className="muted">本機 Demo 模式已開，可一鍵假裝已付款。</p>
								<DemoGrantButton />
							</>
						) : (
							<div className="actions">
								<Link className="button" href="/checkout">
									去購買 NT$8800
								</Link>
							</div>
						)}
					</>
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
