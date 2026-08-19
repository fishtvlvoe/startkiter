import { getSession } from "@auth/lib/server";
import { calculateCourseProgress } from "@startkiter/api/modules/course/progress";
import { resolveVideoSource } from "@startkiter/course/video-resolver";
import { db } from "@startkiter/database";
import { notFound, redirect } from "next/navigation";

import { userHasCourseAccess } from "../../../../../../lib/course-access";
import { canReadCourseLesson } from "../../../../../../lib/course-lesson-access";
import { isCourseOperator } from "../../../../../../lib/course-operator";

import { AcademyClassroomClient } from "./classroom-client";

type LessonPageProps = {
	params: Promise<{ lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	const { lessonId } = await params;
	const lesson = await db.lesson.findFirst({
		where: {
			OR: [{ id: lessonId }, { slug: lessonId }],
			status: "PUBLISHED",
			chapter: { course: { status: "PUBLISHED" } },
		},
		include: {
			chapter: {
				include: {
					course: true,
				},
			},
		},
	});
	if (!lesson) {
		notFound();
	}

	const hasCourseAccess = await userHasCourseAccess(session.user.id);
	if (
		!canReadCourseLesson({
			hasCourseAccess,
			isFreePreview: lesson.isFreePreview,
			status: lesson.status,
		})
	) {
		redirect("/course");
	}

	const [course, completedProgresses] = await Promise.all([
		db.course.findUnique({
			where: { id: lesson.chapter.courseId },
			include: {
				chapters: {
					orderBy: [{ order: "asc" }, { id: "asc" }],
					include: {
						lessons: {
							where: { status: "PUBLISHED" },
							orderBy: [{ order: "asc" }, { id: "asc" }],
						},
					},
				},
			},
		}),
		db.lessonProgress.findMany({
			where: {
				userId: session.user.id,
				completedAt: { not: null },
				lesson: {
					status: "PUBLISHED",
					chapter: {
						courseId: lesson.chapter.courseId,
						course: { status: "PUBLISHED" },
					},
				},
			},
			select: { lessonId: true },
		}),
	]);
	if (!course) {
		notFound();
	}

	const publishedLessons = course.chapters.flatMap((chapter) => chapter.lessons);
	const source = lesson.videoUrl ? resolveVideoSource(lesson.videoUrl) : null;
	const videoSource = source?.ok ? source : null;

	return (
		<AcademyClassroomClient
			curriculum={course.chapters.map((chapter) => ({
				id: chapter.id,
				lessons: chapter.lessons.map((item) => ({
					id: item.id,
					isFreePreview: item.isFreePreview,
					title: item.title,
					videoDuration: item.videoDuration,
				})),
				title: chapter.title,
			}))}
			initialLesson={{
				content: lesson.content,
				id: lesson.id,
				isFreePreview: lesson.isFreePreview,
				title: lesson.title,
				videoDuration: lesson.videoDuration,
				videoSource,
			}}
			initialProgress={calculateCourseProgress({
				completedLessonIds: completedProgresses.map((progress) => progress.lessonId),
				publishedLessonIds: publishedLessons.map((item) => item.id),
			})}
			isOperator={isCourseOperator(session.user)}
		/>
	);
}
