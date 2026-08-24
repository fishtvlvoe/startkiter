import { getSession } from "@auth/lib/server";
import { listCourseInvites } from "@startkiter/api/modules/course/procedures/create-course-invite";
import { isCourseOperator } from "@startkiter/api/modules/course/lib/course-operator";
import { db } from "@startkiter/database";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CourseInvitesPanel } from "./course-invites-panel";

export default async function CourseInvitesPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isCourseOperator(session.user.email, process.env.ADMIN_EMAIL)) redirect("/");

	const [courses, inviteResult] = await Promise.all([
		db.course.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
		listCourseInvites.callable({ context: { headers: await headers() } })({}),
	]);

	return <CourseInvitesPanel courses={courses} initialInvites={inviteResult.invites} />;
}
