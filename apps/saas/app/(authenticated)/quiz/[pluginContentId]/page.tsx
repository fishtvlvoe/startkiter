import { getSession } from "@auth/lib/server";
import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import { getQuizForLearner } from "@startkiter/course-quiz";
import { db } from "@startkiter/database";
import { notFound, redirect } from "next/navigation";

import { QuizTaking } from "./quiz-taking";

type QuizPageProps = {
	params: Promise<{ pluginContentId: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function QuizPage({ params }: QuizPageProps) {
	const session = await getSession();
	if (!session) redirect("/login");

	const { pluginContentId } = await params;
	const quiz = await getQuizForLearner(pluginContentId);
	if (!quiz) notFound();

	const lesson = await db.lesson.findUnique({
		where: { id: quiz.lessonId },
		select: { status: true, isFreePreview: true, chapter: { select: { courseId: true } } },
	});
	if (!lesson || lesson.status !== "PUBLISHED") notFound();

	if (!lesson.isFreePreview && !(await userCanAccessCourseId(session.user.id, lesson.chapter.courseId))) {
		redirect("/course");
	}

	return <QuizTaking quiz={quiz} />;
}
