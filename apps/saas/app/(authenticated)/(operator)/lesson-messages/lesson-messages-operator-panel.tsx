"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Button, Card } from "@startkiter/ui";
import { useEffect, useMemo, useState } from "react";

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

type MessageThread = {
	key: string;
	lessonId: string;
	lessonTitle: string;
	userId: string;
	user: OperatorMessage["user"];
	messages: OperatorMessage[];
};

export function LessonMessagesOperatorPanel({ initialMessages }: { initialMessages: OperatorMessage[] }) {
	const [messages, setMessages] = useState(initialMessages);
	const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);
	const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
	const [status, setStatus] = useState<string | null>(null);

	const threads = useMemo(() => {
		const grouped = new Map<string, MessageThread>();
		for (const message of messages) {
			const key = `${message.lessonId}:${message.userId}`;
			const thread = grouped.get(key);
			if (thread) {
				thread.messages.push(message);
				continue;
			}
			grouped.set(key, {
				key,
				lessonId: message.lessonId,
				lessonTitle: message.lessonTitle,
				userId: message.userId,
				user: message.user,
				messages: [message],
			});
		}
		return [...grouped.values()].map((thread) => ({
			...thread,
			messages: [...thread.messages].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime()),
		}));
	}, [messages]);

	useEffect(() => {
		if (selectedThreadKey && threads.some((thread) => thread.key === selectedThreadKey)) return;
		setSelectedThreadKey(threads[0]?.key ?? null);
	}, [selectedThreadKey, threads]);

	const selectedThread = threads.find((thread) => thread.key === selectedThreadKey) ?? null;

	async function replyTo(thread: MessageThread) {
		const content = replyDrafts[thread.key]?.trim();
		if (!content) return;
		await orpcClient.course.sendLessonMessage({ lessonId: thread.lessonId, content, isFromTeacher: true, threadUserId: thread.userId });
		setReplyDrafts((current) => ({ ...current, [thread.key]: "" }));
		setStatus("老師回覆已送出。");
	}

	async function markRead(messageId: string) {
		await orpcClient.course.markLessonMessageRead({ messageId });
		setMessages((current) => current.map((message) => message.id === messageId ? { ...message, readByTeacher: true } : message));
		setStatus("私訊已標記為已讀。");
	}

	return (
		<div className="space-y-6" data-testid="lesson-messages-operator">
			<div><p className="text-sm text-muted-foreground">Plugin：lesson-private-message</p><h1 className="text-2xl font-bold">學員私訊</h1><p className="mt-1 text-sm text-muted-foreground">在同一畫面切換對話、查看未讀狀態並回覆學員。</p></div>
			{status && <p className="text-sm text-green-600" role="status">{status}</p>}
			<Card className="grid min-h-[32rem] gap-0 overflow-hidden p-0 md:grid-cols-[18rem_1fr]" data-testid="messenger-layout">
				<aside className="border-b border-divider md:border-b-0 md:border-r" aria-label="私訊對話清單">
					<div className="border-b border-divider p-4"><h2 className="font-semibold text-heading">對話（{threads.length}）</h2></div>
					<div className="divide-y divide-divider">
						{threads.length === 0 && <p className="p-4 text-sm text-caption">目前沒有私訊。</p>}
						{threads.map((thread) => {
							const unread = thread.messages.some((message) => !message.isFromTeacher && !message.readByTeacher);
							return <button key={thread.key} type="button" onClick={() => setSelectedThreadKey(thread.key)} className={`block w-full p-4 text-left hover:bg-surface-hover ${thread.key === selectedThreadKey ? "bg-surface-hover" : ""}`} data-testid="message-thread">
								<div className="flex items-start justify-between gap-2"><strong className="truncate text-sm text-heading">{thread.user.name}</strong>{unread && <span aria-label="未讀" className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" data-testid="unread-dot" />}</div>
								<p className="mt-1 truncate text-xs text-caption">{thread.lessonTitle}</p>
								<p className="mt-2 truncate text-xs text-body">{thread.messages.at(-1)?.content}</p>
							</button>;
						})}
					</div>
				</aside>
				<section className="flex min-h-[32rem] flex-col" aria-label="私訊對話內容">
					{selectedThread ? <>
						<header className="border-b border-divider p-4"><h2 className="font-semibold text-heading">{selectedThread.user.name}（{selectedThread.user.email}）</h2><p className="mt-1 text-xs text-caption">{selectedThread.lessonTitle}</p></header>
						<div className="flex-1 space-y-3 overflow-y-auto p-4">
							{selectedThread.messages.map((message) => <article key={message.id} className={`space-y-2 rounded-lg border p-3 ${message.isFromTeacher ? "ml-8 border-emerald-500/30 bg-emerald-500/10" : "mr-8 border-divider bg-surface"}`} data-testid="operator-lesson-message">
								<div className="flex items-center justify-between gap-2"><p className="text-xs text-caption">{message.isFromTeacher ? "老師" : "學員"}</p>{!message.isFromTeacher && !message.readByTeacher && <span aria-label="未讀" className="inline-block h-2 w-2 rounded-full bg-red-500" data-testid="unread-dot" />}</div>
								<p className="whitespace-pre-wrap text-sm text-body">{message.content}</p>
								{message.attachmentUrl && <a className="text-sm text-primary underline" href={message.attachmentUrl} target="_blank" rel="noreferrer">查看附件：{message.attachmentName}</a>}
								{!message.isFromTeacher && !message.readByTeacher && <Button type="button" variant="outline" size="sm" onClick={() => void markRead(message.id)}>標記已讀</Button>}
							</article>)}
						</div>
						<div className="border-t border-divider p-4"><div className="flex gap-2"><textarea className="min-h-16 flex-1 rounded-md border border-input bg-background p-2 text-sm text-foreground" value={replyDrafts[selectedThread.key] ?? ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [selectedThread.key]: event.target.value }))} placeholder="回覆這位學員" aria-label="回覆這位學員" /><Button type="button" size="sm" onClick={() => void replyTo(selectedThread)}>回覆</Button></div></div>
					</> : <p className="p-6 text-sm text-caption">從左側選擇一個對話。</p>}
				</section>
			</Card>
		</div>
	);
}
