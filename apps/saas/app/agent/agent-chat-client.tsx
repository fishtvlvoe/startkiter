"use client";

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
				setError(body.error ?? `失敗（${res.status}）`);
				return;
			}
			setReply(body.assistantMessage ?? "");
		} catch {
			setError("送出失敗");
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="panel">
			<h1>站內助手</h1>
			<p className="muted">
				只會查你自己的訂單與課程進度（唯讀）。客服請用 email。
			</p>
			<textarea
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				rows={4}
				style={{ width: "100%" }}
				placeholder="例如：我的訂單狀態？"
			/>
			<div className="actions" style={{ marginTop: "0.75rem" }}>
				<button type="button" className="button" disabled={busy} onClick={() => void send()}>
					{busy ? "送出中…" : "送出"}
				</button>
			</div>
			{error ? <p className="muted">{error}</p> : null}
			{reply ? (
				<pre style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>{reply}</pre>
			) : null}
		</section>
	);
}
