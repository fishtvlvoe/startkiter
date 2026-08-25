import { getSession } from "@auth/lib/server";
import { getLesson, listLessons } from "@startkiter/course";
import { db } from "@startkiter/database";
import { Card } from "@startkiter/ui";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { localizeLesson } from "@course/lib/localize-lesson";
import { CourseReviewPanel } from "./course-review-panel";
import { userHasCourseAccess } from "../../../../../lib/course-access";

export default async function CoursePage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const entitled = await userHasCourseAccess(session.user.id);
	const course = entitled
		? await db.course.findFirst({
				where: { status: "PUBLISHED", chapters: { some: { lessons: { some: { status: "PUBLISHED" } } } } },
				select: { id: true, coverImageUrl: true },
			})
		: null;
	const t = await getTranslations("course");
	const rawLessons = listLessons();
	const lessons = rawLessons.map((lesson) => localizeLesson(lesson, t));
	const firstLesson = entitled
		? rawLessons[0]
			? localizeLesson(getLesson(rawLessons[0].id) ?? rawLessons[0], t)
			: null
		: null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">
					{entitled ? t("entitledDescription") : t("lockedDescription")}
				</p>
			</div>

			{!entitled && (
				<Card className="p-6">
					<p className="text-muted-foreground">{t("lockedNotice")}</p>
					<Link className="text-primary mt-4 inline-block underline" href="/checkout">
						{t("checkout")}
					</Link>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
				<Card className="p-4">
					<h2 className="font-medium">{t("lessonsTitle")}</h2>
					<nav className="mt-3 space-y-1" aria-label={t("lessonsAria")}>
						{lessons.map((lesson) => (
							<Link
								key={lesson.id}
								href={entitled ? `/course/${lesson.id}` : "/course"}
								className="hover:bg-muted block rounded-md px-3 py-2 text-sm"
								aria-disabled={!entitled}
							>
									{lesson.order + 1}. {lesson.title}
							</Link>
						))}
					</nav>
				</Card>

				<Card className="p-6">
					{firstLesson ? (
						<>
							{course?.coverImageUrl ? <img src={`/image-proxy/${course.coverImageUrl}`} alt="課程封面" className="mb-4 aspect-video w-full rounded-lg object-cover" data-testid="course-cover-image" /> : null}
							<h2 className="text-lg font-medium">{firstLesson.title}</h2>
							<p className="text-muted-foreground mt-2">{firstLesson.description}</p>
							<Link className="text-primary mt-4 inline-block underline" href={`/course/${firstLesson.id}`}>
								{t("watch")}
							</Link>
						</>
					) : (
						<div className="text-muted-foreground py-12 text-center">{t("lockedPlayback")}</div>
					)}
				</Card>
			</div>

			{entitled && course && <CourseReviewPanel courseId={course.id} />}
		</div>
	);
}
