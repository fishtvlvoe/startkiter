"use client";

import { eventIteratorToUnproxiedDataStream } from "@orpc/client";
import { useChat } from "@ai-sdk/react";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button, Card, Textarea } from "@startkiter/ui";
import { type FormEvent, useState } from "react";

function messageText(message: {
	parts: Array<{ type: string; text?: string }>;
}): string {
	return message.parts
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text ?? "")
		.join("");
}

export function AiChat() {
	const { messages, sendMessage, status, error } = useChat({
		transport: {
			async sendMessages(options) {
				return eventIteratorToUnproxiedDataStream(
					await orpcClient.ai.stream(
						{ messages: options.messages },
						{ signal: options.abortSignal },
					),
				);
			},
			reconnectToStream() {
				throw new Error("Unsupported");
			},
		},
	});

	const [input, setInput] = useState("");
	const busy = status === "submitted" || status === "streaming";

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const text = input.trim();
		if (!text || busy) {
			return;
		}
		setInput("");
		await sendMessage({ text });
	}

	return (
		<Card className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
			<div
				data-testid="ai-chat-messages"
				className="flex min-h-64 flex-col gap-3"
				aria-live="polite"
			>
				{messages.length === 0 ? (
					<p className="text-sm text-foreground/60">跟 AI 助手說點什麼吧。</p>
				) : null}
				{messages.map((message) => (
					<div
						key={message.id}
						data-role={message.role}
						className="rounded-xl bg-muted p-3 text-sm whitespace-pre-wrap"
					>
						<span className="mb-1 block text-xs font-medium text-foreground/60">
							{message.role === "user" ? "你" : "AI 助手"}
						</span>
						{messageText(message)}
					</div>
				))}
			</div>

			{error ? (
				<p data-testid="ai-chat-error" className="text-destructive text-sm" role="alert">
					對話失敗：{error.message || "無法取得回覆，請稍後再試。"}
				</p>
			) : null}

			<form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
				<label className="block space-y-2 text-sm">
					<span>訊息</span>
					<Textarea
						name="message"
						value={input}
						onChange={(event) => setInput(event.target.value)}
						rows={4}
						placeholder="輸入你的問題…"
						disabled={busy}
					/>
				</label>
				<Button type="submit" variant="primary" disabled={busy || !input.trim()} loading={busy}>
					{busy ? "回覆中…" : "送出"}
				</Button>
			</form>
		</Card>
	);
}
