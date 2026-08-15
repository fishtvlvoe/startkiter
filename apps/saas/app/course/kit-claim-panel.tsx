"use client";

import { useEffect, useState } from "react";

type ClaimStatus = {
	status: "not_claimed" | "invited" | "accepted" | "revoked" | "failed";
	githubLogin: string | null;
	repo: string | null;
};

const STATUS_LABEL: Record<ClaimStatus["status"], string> = {
	not_claimed: "尚未領取",
	invited: "已邀請，請到 GitHub 接受",
	accepted: "已領取",
	revoked: "已取消（例如退款）",
	failed: "領取失敗，請稍後再試或聯繫客服",
};

export function KitClaimPanel() {
	const [status, setStatus] = useState<ClaimStatus | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [unavailable, setUnavailable] = useState(false);
	const [busy, setBusy] = useState(false);

	async function refresh() {
		const res = await fetch("/api/github/claim-status");
		if (res.status === 503) {
			setUnavailable(true);
			setStatus(null);
			return;
		}
		if (!res.ok) {
			setMessage("暫時讀不到領取狀態，請稍後再試。");
			return;
		}
		setUnavailable(false);
		setStatus((await res.json()) as ClaimStatus);
	}

	useEffect(() => {
		void refresh();
	}, []);

	async function bindGithub() {
		setBusy(true);
		setMessage(null);
		try {
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
				setMessage("現在無法綁定 GitHub，請確認已登入後再試。");
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
			if (res.status === 503) {
				setUnavailable(true);
				setMessage("代碼包領取尚未開放（站方還在設定 GitHub）。");
			} else if (!res.ok) {
				setMessage(body.error ?? "領取失敗，請稍後再試。");
			} else {
				setMessage(body.message ?? "已送出邀請，請到 GitHub 通知接受。");
			}
			await refresh();
		} finally {
			setBusy(false);
		}
	}

	return (
		<section className="panel">
			<h2>終身代碼包</h2>
			{unavailable ? (
				<p className="muted">代碼包領取尚未開放。站方還在設定 GitHub 倉庫與金鑰，開放後你會在這裡一鍵領取。</p>
			) : (
				<>
					<p className="muted">
						先綁定 GitHub，再領取。我們會邀請你進私人倉庫（唯讀）。若顯示「已邀請」，還得到 GitHub 接受邀請。
					</p>
					<div className="actions">
						<button type="button" className="button secondary" disabled={busy} onClick={() => void bindGithub()}>
							綁定 GitHub
						</button>
						<button type="button" className="button" disabled={busy} onClick={() => void claim()}>
							{busy ? "處理中…" : "領取代碼包"}
						</button>
					</div>
					{status ? (
						<p className="muted">
							目前：{STATUS_LABEL[status.status]}
							{status.githubLogin ? ` · ${status.githubLogin}` : ""}
							{status.repo ? ` · ${status.repo}` : ""}
						</p>
					) : null}
					{message ? <p className="muted">{message}</p> : null}
				</>
			)}
		</section>
	);
}
