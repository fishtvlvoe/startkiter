import { getSession } from "@auth/lib/server";
import { db } from "@startkiter/database";
import { Card } from "@startkiter/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { userHasCourseAccess } from "../../../../../lib/course-access";

export default async function CoursePage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const [course, hasCourseAccess] = await Promise.all([
		db.course.findFirst({
			where: { status: "PUBLISHED" },
			orderBy: [{ publishedAt: "asc" }, { id: "asc" }],
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
		userHasCourseAccess(session.user.id),
	]);
	const lessons = course?.chapters.flatMap((chapter) => chapter.lessons) ?? [];
	const firstReadableLesson = lessons.find(
		(lesson) => hasCourseAccess || lesson.isFreePreview,
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">電馭學院</h1>
				<p className="text-muted-foreground mt-1">
					{hasCourseAccess ? "從已發布課綱繼續學習。" : "可先觀看標示試看的已發布單元。"}
				</p>
			</div>

			{!hasCourseAccess ? (
				<Card className="p-6">
					<p className="text-muted-foreground">完整單元需要購買開站包後才能播放。</p>
					<Link className="text-primary mt-4 inline-block underline" href="/checkout">
						前往結帳
					</Link>
				</Card>
			) : null}

			{course ? (
				<div className="grid gap-6 lg:grid-cols-[300px_1fr]">
					<Card className="p-4">
						<h2 className="font-medium">已發布課綱</h2>
						<nav aria-label="課程單元" className="mt-3 space-y-4">
							{course.chapters.map((chapter) => (
								<div key={chapter.id}>
									<p className="text-muted-foreground text-xs font-semibold">{chapter.title}</p>
									<div className="mt-1 space-y-1">
										{chapter.lessons.map((lesson) => {
											const readable = hasCourseAccess || lesson.isFreePreview;
											return (
												<Link
													aria-disabled={!readable}
													className="hover:bg-muted block rounded-md px-3 py-2 text-sm aria-disabled:pointer-events-none aria-disabled:opacity-50"
													href={readable ? "/course/" + lesson.id : "/course"}
													key={lesson.id}
												>
													{lesson.title}
												</Link>
											);
										})}
									</div>
								</div>
							))}
						</nav>
					</Card>

					<Card className="p-6">
						{firstReadableLesson ? (
							<>
								<h2 className="text-lg font-medium">{firstReadableLesson.title}</h2>
								<p className="text-muted-foreground mt-2">
									{firstReadableLesson.isFreePreview && !hasCourseAccess
										? "這是可合法試看的已發布單元。"
										: "已準備好從這個單元開始。"}
								</p>
								<Link
									className="text-primary mt-4 inline-block underline"
									href={"/course/" + firstReadableLesson.id}
								>
									開始播放
								</Link>
							</>
						) : (
							<p className="text-muted-foreground">尚無可觀看的已發布單元。</p>
						)}
					</Card>
				</div>
			) : (
				<Card className="p-6">
					<p className="text-muted-foreground">課程正在準備中。</p>
				</Card>
			)}
		</div>
	);
}
