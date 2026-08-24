"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useEffect, useState } from "react";

type Comment = {
	id: string;
	content: string;
	isAnonymous: boolean;
	authorName: string;
	createdAt: Date;
};

export function LessonCommentsPanel({ lessonId }: { lessonId: string }) {
	const [comments, setComments] = useState<Comment[]>([]);
	const [content, setContent] = useState("");
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function refresh() {
		const result = await orpcClient.review.listLessonComments({ lessonId });
		setComments(result.comments as Comment[]);
	}

	useEffect(() => {
		void refresh().catch(() => setMessage("留言目前無法載入。"));
	}, [lessonId]);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!content.trim()) return;
		try {
			await orpcClient.review.createLessonComment({ lessonId, content: content.trim(), isAnonymous });
			setContent("");
			setMessage("留言已送出。 ");
			await refresh();
		} catch {
			setMessage("留言送出失敗。 ");
		}
	}

	return (
		<section className="space-y-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5" data-testid="lesson-comments-panel">
			<div>
				<h2 className="text-base font-bold text-neutral-100">單元留言</h2>
				<p className="mt-1 text-sm text-neutral-400">可以選擇匿名顯示；後台仍保留真實身份。</p>
			</div>
			<form className="space-y-3" onSubmit={submit} aria-label="lesson-comment-form">
				<textarea
					className="min-h-20 w-full rounded-md border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-100"
					value={content}
					onChange={(event) => setContent(event.target.value)}
					placeholder="寫下你的問題或心得"
					maxLength={5000}
					required
				/>
				<label className="flex items-center gap-2 text-sm text-neutral-300">
					<input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
					匿名顯示
				</label>
				<button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white" type="submit">送出留言</button>
			</form>
			{message && <p className="text-sm text-neutral-300" role="status">{message}</p>}
			<div className="space-y-3" data-testid="lesson-comment-list">
				{comments.map((comment) => (
					<article key={comment.id} className="rounded-lg border border-neutral-800 p-3" data-testid="lesson-comment">
						<p className="text-xs text-neutral-500">{comment.authorName}</p>
						<p className="mt-1 text-sm text-neutral-300">{comment.content}</p>
					</article>
				))}
			</div>
		</section>
	);
}
