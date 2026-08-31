import { getSession } from "@auth/lib/server";
import { db } from "@startkiter/database";
import { isOperator } from "@startkiter/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@startkiter/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type AdminCoursePackDetailPageProps = {
	params: Promise<{ coursePackId: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCoursePackDetailPage({ params }: AdminCoursePackDetailPageProps) {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isOperator(session.user, process.env.ADMIN_EMAIL)) redirect("/");

	const { coursePackId } = await params;
	const coursePack = await db.coursePack.findUnique({
		where: { id: coursePackId },
		include: { missions: { orderBy: { sortOrder: "asc" } } },
	});

	if (!coursePack) notFound();

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-6" data-testid="admin-course-pack-detail">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<Link href="/admin/course-pack" className="text-sm text-muted-foreground underline">
						返回 CoursePack 列表
					</Link>
					<h1 className="mt-2 text-2xl font-semibold">{coursePack.title}</h1>
					<p className="mt-1 text-sm text-muted-foreground">狀態：{coursePack.status}</p>
				</div>
				<Link href={`/course-pack/${coursePack.id}`} className="text-primary underline">
					開啟學員頁面
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Mission 清單</CardTitle>
				</CardHeader>
				<CardContent>
					{coursePack.missions.length === 0 ? (
						<p className="text-sm text-muted-foreground">這個 CoursePack 沒有 Mission。</p>
					) : (
						<div className="space-y-3">
							{coursePack.missions.map((mission) => (
								<div
									key={mission.id}
									className="rounded-xl border p-4"
									data-testid="course-pack-mission-row"
									data-sort-order={mission.sortOrder}
								>
									<div className="flex flex-wrap items-baseline justify-between gap-2">
										<h2 className="font-medium">{mission.title}</h2>
										<span className="text-sm text-muted-foreground">排序：{mission.sortOrder}</span>
									</div>
									<p className="mt-2 text-sm text-muted-foreground">{mission.goal}</p>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
