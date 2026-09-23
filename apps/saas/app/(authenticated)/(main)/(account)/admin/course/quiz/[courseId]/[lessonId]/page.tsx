import { getSession } from "@auth/lib/server";
import { getQuizAttemptsForAdmin } from "@startkiter/api/modules/quiz/quiz-results";
import { db } from "@startkiter/database";
import { redirect } from "next/navigation";

import { QuizResultsTable } from "./quiz-results-table";

type PageProps = { params: Promise<{ courseId: string; lessonId: string }> };

export default async function QuizResultsPage({ params }: PageProps) {
	const session = await getSession();
	if (!session) redirect("/login");
	const { courseId, lessonId } = await params;
	const [lesson, attempts] = await Promise.all([
		db.lesson.findUnique({ where: { id: lessonId }, select: { title: true, chapter: { select: { courseId: true } } } }),
		getQuizAttemptsForAdmin(session.user.id, courseId, lessonId),
	]);
	if (!lesson || lesson.chapter.courseId !== courseId) redirect("/admin/course");

	return <main className="mx-auto max-w-6xl space-y-6 p-6"><header><p className="text-sm text-caption">測驗成績</p><h1 className="text-2xl font-semibold text-heading">{lesson.title}</h1><p className="mt-1 text-sm text-body">顯示每位學員最新一次成績，可展開查看歷次作答。</p></header><QuizResultsTable courseId={courseId} attempts={attempts.map((attempt) => ({ ...attempt, submittedAt: attempt.submittedAt.toISOString() }))} /></main>;
}
