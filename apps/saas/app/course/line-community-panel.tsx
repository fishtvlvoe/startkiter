"use client";

import { useEffect, useState } from "react";

export function LineCommunityPanel() {
	const [inviteUrl, setInviteUrl] = useState<string | null>(null);
	const [unavailable, setUnavailable] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void (async () => {
			try {
				const res = await fetch("/api/community/line-invite", { cache: "no-store" });
				const body = (await res.json()) as { inviteUrl?: string; error?: string };
				if (!res.ok) {
					setUnavailable(true);
					setInviteUrl(null);
					return;
				}
				setInviteUrl(body.inviteUrl ?? null);
				setUnavailable(false);
			} catch {
				setUnavailable(true);
				setInviteUrl(null);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	return (
		<section className="panel">
			<h2>學員 LINE 交流群</h2>
			<p className="muted">付費學員的同儕討論，不是客服。客服請用 email。系統不會幫你自動入群。</p>
			{loading ? <p className="muted">讀取邀請中…</p> : null}
			{!loading && inviteUrl ? (
				<div className="actions">
					<a className="button" href={inviteUrl} target="_blank" rel="noreferrer">
						加入學員 LINE 交流群
					</a>
				</div>
			) : null}
			{!loading && unavailable ? (
				<p className="muted">交流群邀請尚未開放。站方補上邀請連結後，這裡會出現加入按鈕。</p>
			) : null}
		</section>
	);
}
