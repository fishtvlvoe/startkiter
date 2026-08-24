import { getSession } from "@auth/lib/server";
import { isCourseOperator } from "@startkiter/api/modules/course/lib/course-operator";
import { db } from "@startkiter/database";
import { redirect } from "next/navigation";

import { ReviewAdminPanel } from "./review-admin-panel";

export default async function ReviewAdminPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isCourseOperator(session.user.email, process.env.ADMIN_EMAIL)) redirect("/");

	const [reviews, comments, reports] = await Promise.all([
		db.courseReview.findMany({
			orderBy: { createdAt: "desc" },
			include: { user: { select: { name: true, email: true } }, reports: true },
		}),
		db.lessonComment.findMany({
			orderBy: { createdAt: "desc" },
			include: { user: { select: { name: true, email: true } } },
		}),
		db.reviewReport.findMany({
			orderBy: { createdAt: "desc" },
			include: { user: { select: { name: true, email: true } }, review: { select: { id: true, courseId: true, content: true } } },
		}),
	]);

	return (
		<div className="mx-auto max-w-6xl p-6">
			<ReviewAdminPanel
				initialReviews={reviews.map((review) => ({
					id: review.id,
					courseId: review.courseId,
					rating: review.rating,
					content: review.content,
					isVisible: review.isVisible,
					helpfulCount: review.helpfulCount,
					replyContent: review.replyContent,
					user: review.user,
					reportCount: review.reports.length,
				} ))}
				initialComments={comments.map((comment) => ({
					id: comment.id,
					lessonId: comment.lessonId,
					content: comment.content,
					isAnonymous: comment.isAnonymous,
					isRead: comment.isRead,
					userId: comment.userId,
					user: comment.user,
				}))}
				initialReports={reports.map((report) => ({
					id: report.id,
					reason: report.reason,
					user: report.user,
					review: report.review,
				}))}
			/>
		</div>
	);
}
