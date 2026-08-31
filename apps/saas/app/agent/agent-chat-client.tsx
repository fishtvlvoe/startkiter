"use client";

import { Button, Card, Label, Textarea } from "@startkiter/ui";
import { useState } from "react";

export function AgentChatClient() {
	const [message, setMessage] = useState("");
	const [reply, setReply] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function send() {
		setBusy(true);
		setError(null);
		try {
			const res = await fetch("/api/agent/chat", {
				method: "POST",
				headers: { "content-type": "application/json" },
				cache: "no-store",
				body: JSON.stringify({ message }),
			});
			const body = (await res.json()) as {
				assistantMessage?: string;
				error?: string;
			};
			if (!res.ok) {
				setReply(null);
				if (res.status === 503) {
					setError("助手暫時無法使用（站方尚未設定模型金鑰）。");
				} else if (res.status === 401) {
					setError("請先登入再使用助手。");
				} else {
					setError("助手暫時無法回答，請稍後再試。");
				}
				return;
			}
			setReply(body.assistantMessage ?? "");
		} catch {
			setError("送出失敗，請檢查網路後再試。");
		} finally {
			setBusy(false);
		}
	}

	return (
		<Card className="mx-auto max-w-3xl space-y-4 p-6">
			<Label className="block space-y-2">
				<span>你的問題</span>
				<Textarea
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					rows={4}
					placeholder="例如：我的訂單狀態？"
				/>
			</Label>
			<div>
				<Button
					type="button"
					variant="primary"
					disabled={busy || !message.trim()}
					loading={busy}
					onClick={() => void send()}
				>
					{busy ? "送出中…" : "送出"}
				</Button>
			</div>
			{error ? <p className="text-destructive text-sm">{error}</p> : null}
			{reply ? (
				<pre className="bg-muted rounded-xl p-4 text-sm whitespace-pre-wrap">{reply}</pre>
			) : null}
		</Card>
	);
}
