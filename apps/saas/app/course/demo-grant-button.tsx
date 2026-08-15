"use client";

import { useState } from "react";

export function DemoGrantButton() {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onClick() {
		setPending(true);
		setError(null);
		try {
			const res = await fetch("/api/demo/grant-course", {
				method: "POST",
				cache: "no-store",
			});
			if (!res.ok) {
				setError(
					res.status === 403 || res.status === 404
						? "Demo 未開放。"
						: "暫時無法開通，請稍後再試。",
				);
				setPending(false);
				return;
			}
			// router.refresh() 會卡在客戶端路由快取，課頁繼續顯示未購買。
			window.location.assign("/course");
		} catch {
			setError("網路異常，請稍後再試。");
			setPending(false);
		}
	}

	return (
		<div className="actions">
			<button type="button" className="button" disabled={pending} onClick={() => void onClick()}>
				{pending ? "開通中…" : "Demo：一鍵開通課程權限"}
			</button>
			{error ? <p className="error">{error}</p> : null}
		</div>
	);
}
