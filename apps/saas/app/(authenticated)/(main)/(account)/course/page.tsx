import { getSession } from "@auth/lib/server";
import { canAccessCourse, getLesson, listLessons } from "@startkiter/course";
import { db } from "@startkiter/database";
import { Card } from "@startkiter/ui";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MVP_SKU } from "@startkiter/payments/constants";
import { localizeLesson } from "@course/lib/localize-lesson";

async function hasCourseAccess(userId: string) {
	return canAccessCourse(userId, {
		findOrdersForUser: async (id) =>
			db.order.findMany({
				where: { userId: id, sku: MVP_SKU },
				select: { sku: true, courseAccess: true },
			}),
	});
}

export default async function CoursePage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const entitled = await hasCourseAccess(session.user.id);
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
