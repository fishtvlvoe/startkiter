import { getSession } from "@auth/lib/server";
import { getCachedPublishedCurriculum } from "@startkiter/api/modules/course/lib/published-content-cache";
import { hasAnyCourseInstructorAssignment } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { isOperator as checkIsOperator } from "@startkiter/permissions";
import { Card } from "@startkiter/ui";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CoursePreviewPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const isOperator = checkIsOperator(session.user, process.env.ADMIN_EMAIL);
	const isInstructor = !isOperator && (await hasAnyCourseInstructorAssignment(session.user.id));
	if (!isOperator && !isInstructor) {
		redirect("/");
	}

	const [publishedChapters, t] = await Promise.all([
		getCachedPublishedCurriculum().catch(() => []),
		getTranslations("course"),
	]);
	const lessons = (publishedChapters ?? []).flatMap((chapter) => chapter.lessons ?? []);
	const firstLesson = lessons[0] ?? null;

	return (
		<div className="space-y-6">
			{/* 頂部固定返回列：單一返回按鈕 */}
			<div className="flex items-center justify-between border-b pb-4">
				<div className="flex items-center gap-2">
					<span className="rounded bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
						預覽學員模式
					</span>
					<span className="text-muted-foreground text-xs">
						此畫面呈現真實學員看到的課綱，不含管理功能
					</span>
				</div>
				<Link
					href="/admin/course"
					className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
				>
					返回課程管理員
				</Link>
			</div>

			<div>
				<h1 className="text-2xl font-semibold">{t("title")}</h1>
				<p className="text-muted-foreground mt-1">{t("entitledDescription")}</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
				<Card className="p-4">
					<h2 className="font-medium">{t("lessonsTitle")}</h2>
					{lessons.length === 0 ? (
						<p className="text-muted-foreground mt-3 text-sm">目前尚無已發布的課程內容。</p>
					) : (
						<nav className="mt-3 space-y-1" aria-label={t("lessonsAria")}>
							{lessons.map((lesson, idx) => (
								<Link
									key={lesson.id}
									href={`/course/${lesson.id}`}
									className="hover:bg-muted block rounded-md px-3 py-2 text-sm"
								>
									{idx + 1}. {lesson.title}
								</Link>
							))}
						</nav>
					)}
				</Card>

				<Card className="p-6">
					{firstLesson ? (
						<>
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
		</div>
	);
}
