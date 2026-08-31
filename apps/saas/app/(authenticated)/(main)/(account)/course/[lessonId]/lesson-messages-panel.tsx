"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useEffect, useState } from "react";

type LessonMessage = {
	id: string;
	content: string;
	isFromTeacher: boolean;
	createdAt: Date;
	attachmentName: string | null;
	attachmentUrl: string | null;
};

export function LessonMessagesPanel({ lessonId }: { lessonId: string }) {
	const [messages, setMessages] = useState<LessonMessage[]>([]);
	const [content, setContent] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	async function refresh() {
		const result = await orpcClient.course.listLessonMessages({ lessonId });
		setMessages(result.messages as LessonMessage[]);
	}

	useEffect(() => {
		void refresh().catch(() => setMessage("私訊目前無法載入。"));
	}, [lessonId]);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!content.trim() || (file && file.size > 10_000_000)) return;
		try {
			let attachmentUploadToken: string | undefined;
			if (file) {
				const attachment = { filename: file.name, mimeType: file.type || "application/octet-stream", size: file.size };
				const uploadPreparation = await orpcClient.course.prepareLessonMessageAttachment({ lessonId, attachment });
				const upload = await fetch(uploadPreparation.signedUploadUrl, {
					method: "PUT",
					headers: { "Content-Type": attachment.mimeType, "If-None-Match": "*" },
					body: file,
				});
				if (!upload.ok) throw new Error("upload failed");
				attachmentUploadToken = uploadPreparation.attachmentUploadToken;
			}
			await orpcClient.course.sendLessonMessage({
				lessonId,
				content: content.trim(),
				...(file ? { attachment: { filename: file.name, mimeType: file.type || "application/octet-stream", size: file.size }, attachmentUploadToken } : {}),
			});
			setContent("");
			setFile(null);
			setMessage("私訊已送出。 ");
			await refresh();
		} catch {
			setMessage("私訊送出失敗。 ");
		}
	}

	return (
		<section className="space-y-4 rounded-xl border border-border bg-card/60 p-5" data-testid="lesson-messages-panel">
			<div>
				<h2 className="text-base font-bold text-card-foreground">單元私訊</h2>
				<p className="mt-1 text-sm text-muted-foreground">只會和老師分享這個單元的問題。</p>
			</div>
			<form className="space-y-3" onSubmit={submit} aria-label="lesson-message-form">
				<textarea className="min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={content} onChange={(event) => setContent(event.target.value)} placeholder="寫下想私下詢問老師的問題" maxLength={10_000} required />
				<div className="flex flex-wrap items-center gap-3">
					<input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} aria-label="私訊附件" className="text-sm text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80" />
					<button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" type="submit">送出私訊</button>
				</div>
			</form>
			{message && <p className="text-sm text-foreground/90" role="status">{message}</p>}
			<div className="space-y-3" data-testid="lesson-message-list">
				{messages.map((item) => (
					<article key={item.id} className={`rounded-lg border p-3 ${item.isFromTeacher ? "border-emerald-500/30 bg-emerald-500/10 text-card-foreground" : "border-border bg-muted/30"}`} data-testid="lesson-message">
						<p className="text-xs text-muted-foreground">{item.isFromTeacher ? "老師" : "我"}</p>
						<p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{item.content}</p>
						{item.attachmentUrl && <a className="mt-2 inline-block text-sm text-primary underline" href={item.attachmentUrl} target="_blank" rel="noreferrer">查看附件：{item.attachmentName}</a>}
					</article>
				))}
			</div>
		</section>
	);
}
