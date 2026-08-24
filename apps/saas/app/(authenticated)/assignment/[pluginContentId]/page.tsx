import { getSession } from "@auth/lib/server";
import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import { getAssignmentDefinition } from "@startkiter/course-assignment";
import { db } from "@startkiter/database";
import { notFound, redirect } from "next/navigation";

import { AssignmentLearner } from "./assignment-learner";

type AssignmentPageProps = { params: Promise<{ pluginContentId: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssignmentPage({ params }: AssignmentPageProps) {
	const session = await getSession();
	if (!session) redirect("/login");
	const { pluginContentId } = await params;
	const definition = await getAssignmentDefinition(pluginContentId);
	if (!definition) notFound();

	const lesson = await db.lesson.findUnique({ where: { id: definition.body.lessonId }, select: { status: true, isFreePreview: true, chapter: { select: { courseId: true } } } });
	if (!lesson || lesson.status !== "PUBLISHED") notFound();
	if (!lesson.isFreePreview && !(await userCanAccessCourseId(session.user.id, lesson.chapter.courseId))) redirect("/course");

	return <AssignmentLearner key={definition.id} assignment={{ id: definition.id, title: definition.title, body: definition.body }} />;
}
