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
				const body = (await res.json().catch(() => ({}))) as { error?: string };
				setError(body.error || `HTTP ${res.status}`);
				return;
			}
			router.refresh();
		} catch {
			setError("network_error");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="actions">
			<button type="button" className="button" disabled={pending} onClick={onClick}>
				{pending ? "開通中…" : "Demo：一鍵開通課程權限"}
			</button>
			{error ? <p className="muted">失敗：{error}</p> : null}
		</div>
	);
}
