import { getSession } from "@auth/lib/server";
import { getCachedPublishedCurriculum } from "@startkiter/api/modules/course/lib/published-content-cache";
import { db } from "@startkiter/database";
import { Card } from "@startkiter/ui";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CourseReviewPanel } from "./course-review-panel";
import { userHasCourseAccess, userHasKitClaimAccess } from "../../../../../lib/course-access";
import { KitClaimButton } from "@shared/components/KitClaimButton";

export default async function CoursePage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const [entitled, courseResult, publishedChapters, kitClaimEligible] = await Promise.all([
		userHasCourseAccess(session.user.id),
		db.course
			.findFirst({
				where: { status: "PUBLISHED", chapters: { some: { lessons: { some: { status: "PUBLISHED" } } } } },
				select: { id: true, coverImageUrl: true, lineInviteUrl: true },
			})
			.catch(() => null),
		getCachedPublishedCurriculum().catch(() => []),
		userHasKitClaimAccess(session.user.id),
	]);
	const course = entitled ? courseResult : null;
	const t = await getTranslations("course");
	const rawLessons = (publishedChapters ?? []).flatMap((chapter) => chapter.lessons ?? []);
	const lessons = rawLessons;
	const firstLesson = entitled ? (rawLessons[0] ?? null) : null;
	const showLineInvite =
		entitled &&
		typeof course?.lineInviteUrl === "string" &&
		course.lineInviteUrl.trim().startsWith("https://");

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">{t("title")}</h1>
					<p className="text-muted-foreground mt-1">
						{entitled ? t("entitledDescription") : t("lockedDescription")}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					{showLineInvite && (
						<a
							href={course!.lineInviteUrl!}
							target="_blank"
							rel="noopener noreferrer"
							data-testid="line-invite-link"
							className="inline-flex h-9 items-center justify-center rounded-md border border-[#06c755]/30 bg-[#06c755]/10 px-4 text-sm font-medium text-[#06c755] hover:bg-[#06c755]/20 transition-colors"
						>
							加入 LINE 學習群
						</a>
					)}
					{kitClaimEligible && (
						<div>
							<KitClaimButton />
						</div>
					)}
				</div>
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
					{lessons.length === 0 ? (
						<p className="text-muted-foreground mt-3 text-sm">目前尚無已發布的課程內容。</p>
					) : (
						<nav className="mt-3 space-y-1" aria-label={t("lessonsAria")}>
							{lessons.map((lesson, idx) => (
								<Link
									key={lesson.id}
									href={entitled ? `/course/${lesson.id}` : "/course"}
									className="hover:bg-muted block rounded-md px-3 py-2 text-sm"
									aria-disabled={!entitled}
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
