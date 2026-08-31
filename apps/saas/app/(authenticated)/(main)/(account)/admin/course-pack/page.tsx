import { createProcedureClient } from "@orpc/server";
import { listCoursePacks } from "@startkiter/api/modules/course/procedures/list-course-packs";
import { isOperator } from "@startkiter/permissions";
import { getSession } from "@auth/lib/server";
import { Card, CardContent, CardHeader, CardTitle } from "@startkiter/ui";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
	year: "numeric",
	month: "numeric",
	day: "numeric",
});

export default async function AdminCoursePackPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isOperator(session.user, process.env.ADMIN_EMAIL)) redirect("/");

	const requestHeaders = await headers();
	const list = createProcedureClient(listCoursePacks, {
		context: { headers: requestHeaders as unknown as Headers },
	});
	const coursePacks = await list({});

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-6" data-testid="admin-course-pack-list">
			<div>
				<h1 className="text-2xl font-semibold">CoursePack 任務包</h1>
				<p className="mt-1 text-muted-foreground">查看已匯入的課程任務包與 Mission。</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>已匯入的 CoursePack</CardTitle>
				</CardHeader>
				<CardContent>
					{coursePacks.length === 0 ? (
						<p className="text-sm text-muted-foreground">目前沒有已匯入的 CoursePack。</p>
					) : (
						<div className="space-y-3">
							{coursePacks.map((coursePack) => (
								<div
									key={coursePack.id}
									className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
									data-testid="course-pack-row"
								>
									<div className="min-w-0">
										<Link
											href={`/admin/course-pack/${coursePack.id}`}
											className="font-medium underline-offset-4 hover:underline"
										>
											{coursePack.title}
										</Link>
										<p className="mt-1 text-sm text-muted-foreground">
											{coursePack.missionCount} 個 Mission · {dateFormatter.format(new Date(coursePack.importedAt))}
										</p>
									</div>
									<div className="flex items-center gap-3 text-sm">
										<span className="rounded-full border px-2.5 py-1" data-testid="course-pack-status">
											{coursePack.status}
										</span>
										<Link className="text-primary underline" href={`/admin/course-pack/${coursePack.id}`}>
											查看 Mission
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
