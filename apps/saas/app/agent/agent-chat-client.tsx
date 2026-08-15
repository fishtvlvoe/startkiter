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
				if (res.status === 503) {
					setError("助手暫時無法使用（站方尚未設定模型金鑰）。");
				} else {
					setError(body.error ?? "送出失敗，請稍後再試。");
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
		<section className="panel stack">
			<div>
				<h1>站內助手</h1>
				<p className="muted">只會查你自己的訂單與課程進度，不能改資料。客服請用 email。</p>
			</div>
			<label className="form">
				你的問題
				<textarea
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					rows={4}
					placeholder="例如：我的訂單狀態？"
				/>
			</label>
			<div className="actions">
				<button type="button" className="button" disabled={busy || !message.trim()} onClick={() => void send()}>
					{busy ? "送出中…" : "送出"}
				</button>
			</div>
			{error ? <p className="error">{error}</p> : null}
			{reply ? <pre className="callout" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{reply}</pre> : null}
		</section>
	);
}
