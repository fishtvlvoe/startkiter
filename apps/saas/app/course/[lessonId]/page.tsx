import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { decideLessonPlayback, getLesson, listLessons } from "@startkiter/course";
import { getMessagesForLocale } from "@startkiter/i18n";
import { Button } from "@startkiter/ui";

import { userHasCourseAccess } from "../../../lib/course-access";
import { shouldShowOperatorSettingsLink } from "../../../lib/operator";
import { getRequestLocale } from "../../../lib/request-locale";
import { AppShell } from "../../components/app-shell";
import { CourseWorkspace } from "../course-workspace";

type PageProps = {
	params: Promise<{ lessonId: string }>;
};

type NavMessages = {
	brand: string;
};

export default async function LessonPage({ params }: PageProps) {
	const { lessonId } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login");
	}

	const lesson = getLesson(lessonId);
	const entitled = await userHasCourseAccess(session.user.id);
	const decision = decideLessonPlayback({
		sessionPresent: true,
		hasCourseAccess: entitled,
		lessonExists: Boolean(lesson),
		lessonId,
	});
	const locale = await getRequestLocale();
	const messages = await getMessagesForLocale<NavMessages>(locale, "saas");
	const lessons = listLessons();
	const showOperatorSettings = shouldShowOperatorSettingsLink(
		true,
		session.user.email,
		process.env.ADMIN_EMAIL,
	);

	if (decision.status === "forbidden") {
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
							<h1 style={{ margin: "0.2rem 0 0", fontSize: "1.5rem", fontWeight: 600 }}>這堂課還不能看</h1>
						</>
					}
				>
					<p>需要先購買開站包。若已退款，課程也會重新鎖住。</p>
					<div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
						<Button asChild variant="primary" className="ds-btn" data-variant="primary" data-size="md">
							<Link href="/checkout">去購買</Link>
						</Button>
						<Button asChild variant="secondary" className="ds-btn" data-variant="secondary" data-size="md">
							<Link href="/course">回課程列表</Link>
						</Button>
					</div>
				</AppShell>
			</main>
		);
	}

	if (decision.status === "not_found" || !lesson) {
		notFound();
	}

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
							買斷後可看全部單元。進度 1 / 3。
						</p>
					</>
				}
			>
				<CourseWorkspace
					lessons={lessons}
					current={lesson}
					entitled={entitled}
					player={
						lesson.mediaKind === "bunny_embed" ? (
							<iframe
								className="lesson-player"
								data-slot="player"
								src={lesson.mediaUrl}
								title={lesson.title}
								allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
								allowFullScreen
							/>
						) : (
							<video className="lesson-player" data-slot="player" controls playsInline preload="metadata" src={lesson.mediaUrl}>
								你的瀏覽器不支援影片播放。
							</video>
						)
					}
				/>
			</AppShell>
		</main>
	);
}
