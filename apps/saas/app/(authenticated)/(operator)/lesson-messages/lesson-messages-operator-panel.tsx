"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Button, Card } from "@startkiter/ui";
import { useState } from "react";

type OperatorMessage = {
	id: string;
	lessonId: string;
	lessonTitle: string;
	userId: string;
	user: { id: string; name: string; email: string };
	content: string;
	isFromTeacher: boolean;
	readByTeacher: boolean;
	attachmentName: string | null;
	attachmentUrl: string | null;
	createdAt: Date;
};

export function LessonMessagesOperatorPanel({ initialMessages }: { initialMessages: OperatorMessage[] }) {
	const [messages, setMessages] = useState(initialMessages);
	const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
	const [status, setStatus] = useState<string | null>(null);

	async function replyTo(message: OperatorMessage) {
		const content = replyDrafts[message.userId]?.trim();
		if (!content) return;
		await orpcClient.course.sendLessonMessage({ lessonId: message.lessonId, content, isFromTeacher: true, threadUserId: message.userId });
		setReplyDrafts((current) => ({ ...current, [message.userId]: "" }));
		setStatus("老師回覆已送出。 ");
	}

	async function markRead(messageId: string) {
		await orpcClient.course.markLessonMessageRead({ messageId });
		setMessages((current) => current.map((message) => message.id === messageId ? { ...message, readByTeacher: true } : message));
		setStatus("私訊已標記為已讀。 ");
	}

	return (
		<div className="space-y-6" data-testid="lesson-messages-operator">
			<div><p className="text-sm text-muted-foreground">Plugin：lesson-private-message</p><h1 className="text-2xl font-bold">單元私訊</h1><p className="mt-1 text-sm text-muted-foreground">查看學員對單元的私訊、回覆並處理未讀狀態。</p></div>
			{status && <p className="text-sm text-green-600" role="status">{status}</p>}
			<Card className="space-y-4 p-5">
				<h2 className="text-lg font-semibold">訊息（{messages.length}）</h2>
				{messages.length === 0 && <p className="text-sm text-muted-foreground">目前沒有私訊。</p>}
				{messages.map((message) => <article key={message.id} className="space-y-3 rounded-lg border p-4" data-testid="operator-lesson-message">
					<div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{message.user.name}（{message.user.email}）</p><p className="text-xs text-muted-foreground">{message.lessonTitle}</p></div>
					<p className="whitespace-pre-wrap text-sm">{message.content}</p>
					{message.attachmentUrl && <a className="text-sm text-primary underline" href={message.attachmentUrl} target="_blank" rel="noreferrer">查看附件：{message.attachmentName}</a>}
					<p className="text-xs text-muted-foreground">{message.isFromTeacher ? "老師回覆" : message.readByTeacher ? "已讀" : "未讀"}</p>
					<div className="flex gap-2"><textarea className="min-h-16 flex-1 rounded-md border p-2 text-sm" value={replyDrafts[message.userId] ?? ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [message.userId]: event.target.value }))} placeholder="回覆這位學員" /><Button type="button" size="sm" onClick={() => void replyTo(message)}>回覆</Button>{!message.isFromTeacher && !message.readByTeacher && <Button type="button" variant="outline" size="sm" onClick={() => void markRead(message.id)}>標記已讀</Button>}</div>
				</article>)}
			</Card>
		</div>
	);
}
