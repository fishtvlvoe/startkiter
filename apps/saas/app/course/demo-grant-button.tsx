"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoGrantButton() {
	const router = useRouter();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onClick() {
		setPending(true);
		setError(null);
		try {
			const res = await fetch("/api/demo/grant-course", { method: "POST" });
			if (!res.ok) {
				setError(res.status === 403 ? "Demo 未開放。" : "暫時無法開通，請稍後再試。");
				return;
			}
			router.refresh();
		} catch {
			setError("網路異常，請稍後再試。");
		} finally {
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
