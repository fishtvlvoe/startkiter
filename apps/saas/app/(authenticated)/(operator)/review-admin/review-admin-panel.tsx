"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Button, Card } from "@startkiter/ui";
import { useState } from "react";

type Review = {
	id: string;
	courseId: string;
	rating: number;
	content: string | null;
	isVisible: boolean;
	helpfulCount: number;
	replyContent: string | null;
	user: { name: string; email: string };
	reportCount: number;
};

type Comment = {
	id: string;
	lessonId: string;
	content: string;
	isAnonymous: boolean;
	isRead: boolean;
	userId: string;
	user: { name: string; email: string };
};

type Report = {
	id: string;
	reason: string;
	user: { name: string; email: string };
	review: { id: string; courseId: string; content: string | null };
};

export function ReviewAdminPanel({
	initialReviews,
	initialComments,
	initialReports,
}: {
	initialReviews: Review[];
	initialComments: Comment[];
	initialReports: Report[];
}) {
	const [reviews, setReviews] = useState(initialReviews);
	const [comments, setComments] = useState(initialComments);
	const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
	const [message, setMessage] = useState<string | null>(null);

	async function toggleReview(review: Review) {
		const updated = await orpcClient.review.operatorHideReview({ reviewId: review.id, isVisible: !review.isVisible });
		setReviews((current) => current.map((item) => item.id === review.id ? { ...item, isVisible: updated.isVisible } : item));
		setMessage("評價顯示狀態已更新。 ");
	}

	async function replyToReview(reviewId: string) {
		const replyContent = replyDrafts[reviewId]?.trim();
		if (!replyContent) return;
		const updated = await orpcClient.review.operatorReplyReview({ reviewId, replyContent });
		setReviews((current) => current.map((item) => item.id === reviewId ? { ...item, replyContent: updated.replyContent } : item));
		setReplyDrafts((current) => ({ ...current, [reviewId]: "" }));
		setMessage("回覆已儲存。 ");
	}

	async function markRead(commentId: string) {
		await orpcClient.review.operatorMarkCommentRead({ commentId });
		setComments((current) => current.map((item) => item.id === commentId ? { ...item, isRead: true } : item));
		setMessage("留言已標記為已讀。 ");
	}

	async function softDelete(commentId: string) {
		await orpcClient.review.operatorDeleteComment({ commentId });
		setComments((current) => current.filter((item) => item.id !== commentId));
		setMessage("留言已軟刪除。 ");
	}

	return (
		<div className="space-y-6" data-testid="review-admin">
			<div>
				<p className="text-sm text-muted-foreground">Plugin：review</p>
				<h1 className="text-2xl font-bold">評價與留言管理</h1>
				<p className="mt-1 text-sm text-muted-foreground">管理評價可見度、老師回覆、檢舉與單元留言。匿名留言仍顯示真實身份給 operator。</p>
			</div>
			{message && <p className="text-sm text-green-600" role="status">{message}</p>}

			<Card className="space-y-4 p-5">
				<h2 className="text-lg font-semibold">課程評價（{reviews.length}）</h2>
				{reviews.length === 0 && <p className="text-sm text-muted-foreground">目前沒有評價。</p>}
				{reviews.map((review) => (
					<article key={review.id} className="space-y-3 rounded-lg border p-4" data-testid="operator-review">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div><span className="text-amber-500">{"★".repeat(review.rating)}</span> <span className="text-sm">{review.user.name}（{review.user.email}）</span></div>
							<span className="text-xs text-muted-foreground">課程：{review.courseId}</span>
						</div>
						{review.content && <p className="text-sm">{review.content}</p>}
						<p className="text-xs text-muted-foreground">有用票：{review.helpfulCount}；檢舉：{review.reportCount}</p>
						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="outline" size="sm" onClick={() => void toggleReview(review)}>{review.isVisible ? "隱藏評價" : "顯示評價"}</Button>
						</div>
						<div className="flex gap-2">
							<textarea className="min-h-16 flex-1 rounded-md border p-2 text-sm" value={replyDrafts[review.id] ?? ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))} placeholder={review.replyContent ?? "回覆這則評價"} />
							<Button type="button" size="sm" onClick={() => void replyToReview(review.id)}>儲存回覆</Button>
						</div>
					</article>
				))}
			</Card>

			<Card className="space-y-4 p-5">
				<h2 className="text-lg font-semibold">單元留言（{comments.length}）</h2>
				{comments.length === 0 && <p className="text-sm text-muted-foreground">目前沒有留言。</p>}
				{comments.map((comment) => (
					<article key={comment.id} className="space-y-2 rounded-lg border p-4" data-testid="operator-comment">
						<p className="text-xs text-muted-foreground">單元：{comment.lessonId}；真實作者：{comment.user.name}（{comment.user.email}）；userId：{comment.userId}</p>
						<p className="text-sm">{comment.content}</p>
						<p className="text-xs">匿名顯示：{comment.isAnonymous ? "是" : "否"}；狀態：{comment.isRead ? "已讀" : "未讀"}</p>
						<div className="flex gap-2">
							{!comment.isRead && <Button type="button" variant="outline" size="sm" onClick={() => void markRead(comment.id)}>標記已讀</Button>}
							<Button type="button" variant="ghost" size="sm" onClick={() => void softDelete(comment.id)}>軟刪除</Button>
						</div>
					</article>
				))}
			</Card>

			<Card className="space-y-4 p-5">
				<h2 className="text-lg font-semibold">評價檢舉（{initialReports.length}）</h2>
				{initialReports.map((report) => <article key={report.id} className="rounded-lg border p-4 text-sm"><p>{report.reason}</p><p className="mt-1 text-xs text-muted-foreground">由 {report.user.name} 檢舉；評價：{report.review.id}</p></article>)}
			</Card>
		</div>
	);
}
