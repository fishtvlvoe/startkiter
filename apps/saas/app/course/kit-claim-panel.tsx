"use client";

import { useEffect, useState } from "react";

type ClaimStatus = {
	status: "not_claimed" | "invited" | "accepted" | "revoked" | "failed";
	githubLogin: string | null;
	repo: string | null;
};

export function KitClaimPanel() {
	const [status, setStatus] = useState<ClaimStatus | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function refresh() {
		const res = await fetch("/api/github/claim-status");
		if (!res.ok) {
			setMessage("無法讀取領取狀態");
			return;
		}
		setStatus((await res.json()) as ClaimStatus);
	}

	useEffect(() => {
		void refresh();
	}, []);

	async function bindGithub() {
		setBusy(true);
		setMessage(null);
		try {
			// 必須用 link-social（需現有 session），不可用 sign-in/social（會另開／切換帳號）
			const response = await fetch("/api/auth/link-social", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					provider: "github",
					callbackURL: "/course",
				}),
			});
			const data = (await response.json()) as { url?: string; error?: string };
			if (!response.ok || !data.url) {
				setMessage(data.error ?? "無法開始 GitHub 綁定（請先登入後再連）");
				return;
			}
			window.location.href = data.url;
		} finally {
			setBusy(false);
		}
	}

	async function claim() {
		setBusy(true);
		setMessage(null);
		try {
			const res = await fetch("/api/github/claim", { method: "POST" });
			const body = (await res.json()) as { error?: string; message?: string };
			if (!res.ok) {
				setMessage(body.error ?? `領取失敗（${res.status}）`);
			} else {
				setMessage(body.message ?? "已送出邀請");
			}
			await refresh();
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="panel" style={{ marginTop: "1.5rem" }}>
			<h2>終身代碼包（GitHub）</h2>
			<p className="muted">
				先綁定 GitHub，再領取。系統會用 GitHub App 邀請你進私人倉庫（只能
				pull）。若狀態是 invited，還要到 GitHub 信箱／通知接受邀請。
			</p>
			<div className="actions" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
				<button
					type="button"
					className="button secondary"
					disabled={busy}
					onClick={() => void bindGithub()}
				>
					綁定 GitHub
				</button>
				<button type="button" className="button" disabled={busy} onClick={() => void claim()}>
					{busy ? "處理中…" : "領取代碼包"}
				</button>
			</div>
			{status ? (
				<p>
					狀態：<strong>{status.status}</strong>
					{status.githubLogin ? `（${status.githubLogin}）` : ""}
					{status.repo ? ` → ${status.repo}` : ""}
				</p>
			) : null}
			{message ? <p className="muted">{message}</p> : null}
		</section>
	);
}
