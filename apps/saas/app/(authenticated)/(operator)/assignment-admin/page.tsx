import { getSession } from "@auth/lib/server";
import { isOperator } from "@startkiter/permissions";
import { db } from "@startkiter/database";
import { redirect } from "next/navigation";

import { AssignmentAdminForm } from "./assignment-admin-form";

export default async function AssignmentAdminPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isOperator(session.user, process.env.ADMIN_EMAIL)) redirect("/");

	const lessons = await db.lesson.findMany({
		where: { status: "PUBLISHED" },
		orderBy: [{ chapter: { course: { title: "asc" } } }, { chapter: { order: "asc" } }, { order: "asc" }],
		select: { id: true, title: true, chapter: { select: { title: true, course: { select: { title: true } } } } },
	});
	const existingAssignments = await db.pluginContent.findMany({
		where: { pluginId: "assignment", type: "assignment-definition" },
		orderBy: { createdAt: "desc" },
		select: { id: true, title: true },
	});

	return (
		<div className="mx-auto max-w-5xl p-6">
			<AssignmentAdminForm lessons={lessons.map((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				chapterTitle: lesson.chapter.title,
				courseTitle: lesson.chapter.course.title,
			}))} existingAssignments={existingAssignments} />
		</div>
	);
}
