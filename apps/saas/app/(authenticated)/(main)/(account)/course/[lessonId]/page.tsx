import { getSession } from "@auth/lib/server";
import { decideLessonPlayback, getLesson, listLessons } from "@startkiter/course";
import { Card } from "@startkiter/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { userHasCourseAccess } from "../../../../../../lib/course-access";

type LessonPageProps = {
	params: Promise<{ lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
	const { lessonId: rawLessonId } = await params;
	const lessonId = rawLessonId.trim();
	if (!lessonId) {
		notFound();
	}

	const session = await getSession();
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

	if (decision.status === "not_found" || !lesson) {
		notFound();
	}

	if (decision.status === "forbidden") {
		return (
			<Card className="p-8">
				<h1 className="text-xl font-semibold">這堂課還不能看</h1>
				<p className="text-muted-foreground mt-2">
					需要先購買開站包。若訂單已退款，課程也會重新鎖住。
				</p>
				<Link className="text-primary mt-4 inline-block underline" href="/checkout">
					前往結帳
				</Link>
			</Card>
		);
	}

	const lessons = listLessons();
	const index = lessons.findIndex((item) => item.id === lesson.id);
	const previous = index > 0 ? lessons[index - 1] : null;
	const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;

	return (
		<div className="space-y-6">
			<div>
				<p className="text-muted-foreground text-sm">課程單元 {lesson.order} / {lessons.length}</p>
				<h1 className="mt-1 text-2xl font-semibold">{lesson.title}</h1>
				<p className="text-muted-foreground mt-2">{lesson.description}</p>
			</div>

			<Card className="overflow-hidden p-0">
				{lesson.mediaKind === "bunny_embed" ? (
					<iframe
						className="aspect-video w-full"
						src={lesson.mediaUrl}
						title={lesson.title}
						allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
						allowFullScreen
					/>
				) : (
					<video className="aspect-video w-full bg-black" controls playsInline preload="metadata" src={lesson.mediaUrl}>
						你的瀏覽器不支援影片播放。
					</video>
				)}
			</Card>

			{lesson.isDemoFallback && (
				<p className="text-muted-foreground text-sm">
					目前播放的是暫時示範影片；接上 Bunny 課片後會自動換成正式內容。
				</p>
			)}

			<div className="flex gap-3">
				{previous && <Link className="text-primary underline" href={`/course/${previous.id}`}>上一單元</Link>}
				{next && <Link className="text-primary underline" href={`/course/${next.id}`}>下一單元</Link>}
			</div>
		</div>
	);
}
