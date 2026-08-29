import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import { canManageCourse } from "@startkiter/api/modules/course/lib/course-instructor-access";
import { isCourseOperator } from "@startkiter/api/modules/course/lib/course-operator";
import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import {
	decodeLessonToolOrigin,
	encodeLessonToolOrigin,
} from "@startkiter/platform/src/lesson-tool/embed-path";
import { verifyLessonToolToken } from "@startkiter/platform/src/lesson-tool/token";
import { checkLessonToolUrl } from "@startkiter/platform/src/lesson-tool/url-safety";

export const dynamic = "force-dynamic";

type LessonToolPageProps = {
	params: Promise<{ lessonId: string; encodedOrigin: string }>;
	searchParams: Promise<{ token?: string | string[] }>;
};

function unavailable() {
	return <p>工具目前無法使用，請重新整理頁面</p>;
}

export default async function LessonToolPage({ params, searchParams }: LessonToolPageProps) {
	const { lessonId, encodedOrigin } = await params;
	const query = await searchParams;
	const token = Array.isArray(query.token) ? query.token[0] : query.token;
	const requestHeaders = await headers();
	const session = await auth.api.getSession({ headers: requestHeaders });

	if (!session?.user?.id) {
		notFound();
	}

	const lesson = await db.lesson.findUnique({
		where: { id: lessonId },
		select: {
			id: true,
			toolUrl: true,
			toolTitle: true,
			chapter: { select: { courseId: true } },
		},
	});
	if (!lesson?.toolUrl) {
		notFound();
	}

	const courseId = lesson.chapter.courseId;
	const userId = session.user.id;
	const hasLearnerAccess = await userCanAccessCourseId(userId, courseId);
	const hasInstructorAccess = await canManageCourse({
		userId,
		courseId,
		isOperator: isCourseOperator(session.user.email, process.env.ADMIN_EMAIL),
	});
	if (!hasLearnerAccess && !hasInstructorAccess) {
		notFound();
	}

	if (!token || !verifyLessonToolToken(token, lessonId, userId)) {
		return unavailable();
	}

	const urlCheck = await checkLessonToolUrl(lesson.toolUrl);
	if (!urlCheck.ok) {
		return unavailable();
	}

	let allowedOrigin: string;
	try {
		allowedOrigin = new URL(lesson.toolUrl).origin;
	} catch {
		return unavailable();
	}

	const requestedOrigin = decodeLessonToolOrigin(encodedOrigin);
	if (requestedOrigin !== allowedOrigin || encodeLessonToolOrigin(allowedOrigin) !== encodedOrigin) {
		notFound();
	}

	const title = lesson.toolTitle?.trim() || "課程工具";

	return (
		<div>
			<h1>{title}</h1>
			<iframe
				src={lesson.toolUrl}
				title={title}
				sandbox="allow-scripts allow-forms allow-popups allow-downloads"
			/>
		</div>
	);
}
