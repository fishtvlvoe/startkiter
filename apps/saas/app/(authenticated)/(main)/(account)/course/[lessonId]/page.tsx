import { getSession } from "@auth/lib/server";
import { decideLessonPlayback, getLesson, listLessons } from "@startkiter/course";
import { Card } from "@startkiter/ui";
import { localizeLesson } from "@course/lib/localize-lesson";
import { getTranslations } from "next-intl/server";
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

	const rawLesson = getLesson(lessonId);
	const entitled = await userHasCourseAccess(session.user.id);
	const decision = decideLessonPlayback({
		sessionPresent: true,
		hasCourseAccess: entitled,
		lessonExists: Boolean(rawLesson),
		lessonId,
	});

	if (decision.status === "not_found" || !rawLesson) {
		notFound();
	}

	const t = await getTranslations("course");
	const lesson = localizeLesson(rawLesson, t);

	if (decision.status === "forbidden") {
		return (
			<Card className="p-8">
				<h1 className="text-xl font-semibold">{t("forbiddenTitle")}</h1>
				<p className="text-muted-foreground mt-2">
					{t("forbiddenDescription")}
				</p>
				<Link className="text-primary mt-4 inline-block underline" href="/checkout">
					{t("checkout")}
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
				<p className="text-muted-foreground text-sm">
					{t("lessonProgress", { order: lesson.order, total: lessons.length })}
				</p>
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
						{t("videoUnsupported")}
					</video>
				)}
			</Card>

			{lesson.isDemoFallback && (
				<p className="text-muted-foreground text-sm">
					{t("demoFallback")}
				</p>
			)}

			<div className="flex gap-3">
				{previous && <Link className="text-primary underline" href={`/course/${previous.id}`}>{t("previous")}</Link>}
				{next && <Link className="text-primary underline" href={`/course/${next.id}`}>{t("next")}</Link>}
			</div>
		</div>
	);
}
