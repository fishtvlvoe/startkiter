import { getSession } from "@auth/lib/server";
import { getQuizAttemptDetail } from "@startkiter/api/modules/quiz/quiz-results";
import Link from "next/link";
import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ courseId: string; attemptId: string }> };

export default async function QuizAttemptDetailPage({ params }: PageProps) {
	const session = await getSession();
	if (!session) redirect("/login");
	const { courseId, attemptId } = await params;
	const detail = await getQuizAttemptDetail(session.user.id, courseId, attemptId);

	return <main className="mx-auto max-w-4xl space-y-6 p-6"><Link href={`/admin/course/quiz/${courseId}/${detail.lessonId}`} className="text-sm text-primary underline">返回成績列表</Link><header><h1 className="mt-2 text-2xl font-semibold text-heading">{detail.userName} 的作答紀錄</h1><p className="mt-1 text-sm text-body">{detail.userEmail} · {detail.score} 分 · {detail.passed ? "及格" : "未及格"}</p></header><section className="space-y-3" aria-label="逐題對照結果">{detail.questions.map((question, index) => <article key={question.id} className="space-y-2 rounded-lg border border-divider bg-surface p-4"><h2 className="font-medium text-heading">{index + 1}. {question.content}</h2><p className="text-sm text-body">學員答案：{String(question.selectedAnswer ?? "未作答")}</p><p className="text-sm text-body">正確答案：{String(question.correctAnswer)}</p><p className={question.correct ? "text-sm text-green-600" : "text-sm text-red-600"}>{question.correct ? "答對" : "答錯"}</p></article>)}</section></main>;
}
