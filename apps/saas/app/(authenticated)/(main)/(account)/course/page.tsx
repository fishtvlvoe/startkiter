import { getSession } from "@auth/lib/server";
import { canAccessCourse, getLesson, listLessons } from "@startkiter/course";
import { db } from "@startkiter/database";
import { Card } from "@startkiter/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MVP_SKU } from "@startkiter/payments/constants";

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
	const lessons = listLessons();
	const firstLesson = entitled ? getLesson(lessons[0]?.id ?? "") : null;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">課程</h1>
				<p className="text-muted-foreground mt-1">
					{entitled ? "買斷後可看全部單元。" : "購買開站包後即可解鎖全部單元。"}
				</p>
			</div>

			{!entitled && (
				<Card className="p-6">
					<p className="text-muted-foreground">目前尚未取得課程權限，影片內容不會送到瀏覽器。</p>
					<Link className="text-primary mt-4 inline-block underline" href="/checkout">
						前往結帳
					</Link>
				</Card>
			)}

			<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
				<Card className="p-4">
					<h2 className="font-medium">單元列表</h2>
					<nav className="mt-3 space-y-1" aria-label="課程單元">
						{lessons.map((lesson) => (
							<Link
								key={lesson.id}
								href={entitled ? `/course/${lesson.id}` : "/course"}
								className="hover:bg-muted block rounded-md px-3 py-2 text-sm"
								aria-disabled={!entitled}
							>
									{lesson.order}. {lesson.title}
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
								開始觀看
							</Link>
						</>
					) : (
						<div className="text-muted-foreground py-12 text-center">購買後才能播放課程。</div>
					)}
				</Card>
			</div>
		</div>
	);
}
