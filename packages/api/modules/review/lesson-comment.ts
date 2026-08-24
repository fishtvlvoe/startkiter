export type LessonCommentViewerRole = "learner" | "operator";

export type LessonCommentRecord = {
	id: string;
	lessonId: string;
	userId: string;
	content: string;
	isAnonymous: boolean;
	isRead: boolean;
	deletedAt: Date | null;
	createdAt: Date;
	user?: { name: string } | null;
};

export function serializeLessonCommentForViewer(
	comment: LessonCommentRecord,
	role: LessonCommentViewerRole,
) {
	const authorName = comment.isAnonymous && role === "learner" ? "匿名學員" : comment.user?.name ?? "學員";

	const base = {
		id: comment.id,
		lessonId: comment.lessonId,
		content: comment.content,
		isAnonymous: comment.isAnonymous,
		isRead: comment.isRead,
		deletedAt: comment.deletedAt,
		createdAt: comment.createdAt,
		authorName,
	};

	return role === "operator" ? { ...base, userId: comment.userId } : base;
}
