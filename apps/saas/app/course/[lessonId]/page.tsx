import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { decideLessonPlayback, getLesson } from "@startkiter/course";

import { SiteNav } from "../../components/site-nav";
import { userHasCourseAccess } from "../../../lib/course-access";

type PageProps = {
	params: Promise<{ lessonId: string }>;
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

	if (decision.status === "forbidden") {
		return (
			<main>
				<SiteNav signedIn email={session.user.email} hasPurchase={entitled} />
				<section className="panel">
					<h1>這堂課還不能看</h1>
					<p>需要先購買開站包。若已退款，課程也會重新鎖住。</p>
					<div className="actions">
						<Link className="button" href="/checkout">
							去購買
						</Link>
						<Link className="button secondary" href="/course">
							回課程列表
						</Link>
					</div>
				</section>
			</main>
		);
	}

	if (decision.status === "not_found" || !lesson) {
		notFound();
	}

	return (
		<main>
			<SiteNav signedIn email={session.user.email} hasPurchase={entitled} />
			<section className="panel stack">
				<p className="muted">
					<Link href="/course">← 全部課程</Link>
				</p>
				<h1>{lesson.title}</h1>
				<p className="muted">{lesson.description}</p>
				{lesson.isDemoFallback ? (
					<p className="callout" style={{ margin: 0 }}>
						目前播放的是暫時示範影片。站方接上 Bunny 課片後會自動換成正式內容。
					</p>
				) : null}
				{lesson.mediaKind === "bunny_embed" ? (
					<iframe
						className="lesson-player"
						src={lesson.mediaUrl}
						title={lesson.title}
						allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
						allowFullScreen
					/>
				) : (
					<video className="lesson-player" controls playsInline preload="metadata" src={lesson.mediaUrl}>
						你的瀏覽器不支援影片播放。
					</video>
				)}
			</section>
		</main>
	);
}
