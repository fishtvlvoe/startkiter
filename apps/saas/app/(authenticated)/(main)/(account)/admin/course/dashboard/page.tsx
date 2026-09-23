import { getSession } from "@auth/lib/server";
import { getCourseDashboardMetrics } from "@startkiter/api/modules/course/lib/course-dashboard";
import { hasAnyCourseInstructorAssignment } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { isOperator } from "@startkiter/permissions";
import { Card } from "@startkiter/ui";
import { redirect } from "next/navigation";

export default async function CourseDashboardPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	const operator = isOperator(session.user, process.env.ADMIN_EMAIL);
	if (!operator && session.user.role !== "instructor" && !(await hasAnyCourseInstructorAssignment(session.user.id))) redirect("/");

	const metrics = await getCourseDashboardMetrics(session.user.id);
	const cards = [
		["上架課程數", metrics.publishedCourseCount.toLocaleString("zh-TW")],
		["累計學員人數", metrics.studentCount.toLocaleString("zh-TW")],
		["近 30 天營收", `NT$ ${metrics.revenueLast30Days.toLocaleString("zh-TW")}`],
	] as const;

	return (
		<main className="mx-auto max-w-6xl space-y-6 p-6" data-testid="course-dashboard">
			<header>
				<p className="text-sm text-caption">課程管理</p>
				<h1 className="text-3xl font-semibold text-heading">課程儀表板</h1>
				<p className="mt-2 text-sm text-body">統計範圍依目前帳號可管理的課程計算。</p>
			</header>
			<section className="grid gap-4 md:grid-cols-3" aria-label="課程營運指標">
				{cards.map(([label, value]) => (
					<Card key={label} className="space-y-2 p-5">
						<p className="text-sm text-caption">{label}</p>
						<p className="text-3xl font-semibold text-heading">{value}</p>
					</Card>
				))}
			</section>
		</main>
	);
}
