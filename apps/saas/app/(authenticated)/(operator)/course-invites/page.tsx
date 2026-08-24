import { getSession } from "@auth/lib/server";
import { isCourseOperator } from "@startkiter/api/modules/course/lib/course-operator";
import { db } from "@startkiter/database";
import { redirect } from "next/navigation";

import { CourseInvitesPanel } from "./course-invites-panel";

export default async function CourseInvitesPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isCourseOperator(session.user.email, process.env.ADMIN_EMAIL)) redirect("/");

	const [courses, invites] = await Promise.all([
		db.course.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
		db.courseInvite.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				courseId: true,
				email: true,
				maxUses: true,
				usedCount: true,
				expiresAt: true,
				active: true,
				createdAt: true,
				course: { select: { id: true, title: true } },
			},
		}),
	]);

	return <CourseInvitesPanel courses={courses} initialInvites={invites} />;
}
