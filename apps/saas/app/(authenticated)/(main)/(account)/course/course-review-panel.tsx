"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useEffect, useState } from "react";

type Review = {
	id: string;
	rating: number;
	content: string | null;
	helpfulCount: number;
	replyContent: string | null;
	replyAt: Date | null;
	createdAt: Date;
	user: { name: string };
};

export function CourseReviewPanel({ courseId }: { courseId: string }) {
	const [averageRating, setAverageRating] = useState(0);
	const [reviewCount, setReviewCount] = useState(0);
	const [reviews, setReviews] = useState<Review[]>([]);
	const [rating, setRating] = useState(5);
	const [content, setContent] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	async function refresh() {
		const [summary, reviewList] = await Promise.all([
			orpcClient.review.getSummary({ courseId }),
			orpcClient.review.list({ courseId }),
		]);
		setAverageRating(summary.averageRating);
		setReviewCount(summary.reviewCount);
		setReviews(reviewList.reviews as Review[]);
	}

	useEffect(() => {
		void refresh().catch(() => setMessage("評價目前無法載入。"));
	}, [courseId]);

	async function submitReview(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsSubmitting(true);
		setMessage(null);
		try {
			await orpcClient.review.create({ courseId, rating, content: content.trim() || null });
			setContent("");
			setMessage("評價已送出。每門課只能評價一次。 ");
			await refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "評價送出失敗。 ");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function markHelpful(reviewId: string) {
		await orpcClient.review.markHelpful({ reviewId });
		await refresh();
	}

	return (
		<section className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5" data-testid="course-review-panel">
			<div>
				<h2 className="text-base font-bold text-neutral-100">課程評價</h2>
				<p className="mt-1 text-sm text-neutral-400" data-testid="review-summary">
					{reviewCount ? `${averageRating.toFixed(1)} / 5（${reviewCount} 則評價）` : "還沒有評價"}
				</p>
			</div>

			<form className="space-y-3 rounded-lg border border-neutral-800 p-4" onSubmit={submitReview} aria-label="course-review-form">
				<div className="flex items-center gap-2" aria-label="評分">
					{[1, 2, 3, 4, 5].map((value) => (
						<button
							key={value}
							type="button"
							className={value <= rating ? "text-amber-400" : "text-neutral-600"}
							aria-label={`${value} 星`}
							aria-pressed={value === rating}
							onClick={() => setRating(value)}
						>
							★
						</button>
					))}
				</div>
				<textarea
					className="min-h-24 w-full rounded-md border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-100"
					value={content}
					onChange={(event) => setContent(event.target.value)}
					placeholder="分享你對這門課的看法（可留白）"
					maxLength={5000}
				/>
				<button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50" type="submit" disabled={isSubmitting}>
					{isSubmitting ? "送出中…" : "送出評價"}
				</button>
			</form>

			{message && <p className="text-sm text-neutral-300" role="status">{message}</p>}

			<div className="space-y-3" data-testid="review-list">
				{reviews.map((review) => (
					<article key={review.id} className="rounded-lg border border-neutral-800 p-4" data-testid="course-review">
						<div className="flex items-center justify-between gap-3 text-sm">
							<span className="text-amber-400">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
							<span className="text-neutral-500">{review.user.name}</span>
						</div>
						{review.content && <p className="mt-2 text-sm text-neutral-300">{review.content}</p>}
						<div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
							<button type="button" className="underline" onClick={() => void markHelpful(review.id)}>有用（{review.helpfulCount}）</button>
						</div>
						{review.replyContent && <p className="mt-3 border-l-2 border-primary pl-3 text-sm text-neutral-300">老師回覆：{review.replyContent}</p>}
					</article>
				))}
			</div>
		</section>
	);
}
