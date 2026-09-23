import { getSession } from "@auth/lib/server";
import { manageableCourseWhereForUser } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { db } from "@startkiter/database";
import { redirect } from "next/navigation";

export default async function CourseCommentsPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	const courseWhere = await manageableCourseWhereForUser(session.user.id);
	const lessons = await db.lesson.findMany({ where: { chapter: { course: courseWhere } }, select: { id: true, title: true } });
	const comments = await db.lessonComment.findMany({
		where: { lessonId: { in: lessons.map((lesson) => lesson.id) }, deletedAt: null },
		orderBy: { createdAt: "desc" },
		include: { user: { select: { name: true, email: true } } },
	});
	const lessonTitles = new Map(lessons.map((lesson) => [lesson.id, lesson.title]));

	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6" data-testid="course-comments-page">
			<header><p className="text-sm text-caption">課程管理</p><h1 className="text-2xl font-semibold text-heading">課程留言</h1><p className="mt-1 text-sm text-body">只顯示目前帳號可管理課程的公開留言。</p></header>
			<section className="space-y-3" aria-label="課程留言列表">
				{comments.length === 0 ? <p className="text-sm text-caption">目前沒有留言。</p> : comments.map((comment) => <article key={comment.id} className="rounded-lg border border-divider bg-surface p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-heading">{comment.user.name}</strong><span className="text-xs text-caption">{lessonTitles.get(comment.lessonId) ?? comment.lessonId}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-body">{comment.content}</p></article>)}
			</section>
		</main>
	);
}
