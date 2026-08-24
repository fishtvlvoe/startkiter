import { getSession } from "@auth/lib/server";
import { isCourseOperator } from "@startkiter/api/modules/course/lib/course-operator";
import { getLessonMessageSignedDownloadUrl } from "@startkiter/api/modules/course/procedures/lesson-message-upload";
import { db } from "@startkiter/database";
import { redirect } from "next/navigation";

import { LessonMessagesOperatorPanel } from "./lesson-messages-operator-panel";

export default async function LessonMessagesPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isCourseOperator(session.user.email, process.env.ADMIN_EMAIL)) redirect("/");

	const messages = await db.lessonPrivateMessage.findMany({
		orderBy: { createdAt: "desc" },
		include: { lesson: { select: { title: true } }, user: { select: { id: true, name: true, email: true } } },
	});
	const initialMessages = await Promise.all(messages.map(async (message) => ({
		id: message.id,
		lessonId: message.lessonId,
		lessonTitle: message.lesson.title,
		userId: message.userId,
		user: message.user,
		content: message.content,
		isFromTeacher: message.isFromTeacher,
		readByTeacher: message.readByTeacher,
		attachmentName: message.attachmentName,
		attachmentUrl: message.attachmentStorageKey && message.attachmentName
			? await getLessonMessageSignedDownloadUrl({ storageKey: message.attachmentStorageKey, filename: message.attachmentName, mimeType: message.attachmentMimeType })
			: null,
		createdAt: message.createdAt,
	})));

	return <div className="mx-auto max-w-5xl p-6"><LessonMessagesOperatorPanel initialMessages={initialMessages} /></div>;
}
