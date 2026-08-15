"use client";

import { useEffect, useState } from "react";

export function LineCommunityPanel() {
	const [inviteUrl, setInviteUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void (async () => {
			try {
				const res = await fetch("/api/community/line-invite", { cache: "no-store" });
				const body = (await res.json()) as { inviteUrl?: string; error?: string };
				if (!res.ok) {
					setError(body.error ?? `無法取得邀請（${res.status}）`);
					setInviteUrl(null);
					return;
				}
				setInviteUrl(body.inviteUrl ?? null);
				setError(null);
			} catch {
				setError("讀取邀請失敗");
				setInviteUrl(null);
			}
		})();
	}, []);

	return (
		<section className="panel" style={{ marginTop: "1.5rem" }}>
			<h2>學員 LINE 交流群</h2>
			<p className="muted">
				這是付費學員的同儕討論群，不是客服。客服請用 email。系統不會幫你靜默入群，要自己點連結加入。
			</p>
			{inviteUrl ? (
				<div className="actions">
					<a className="button" href={inviteUrl} target="_blank" rel="noreferrer">
						加入學員 LINE 交流群
					</a>
				</div>
			) : (
				<p className="muted">{error ?? "讀取邀請中…"}</p>
			)}
		</section>
	);
}
