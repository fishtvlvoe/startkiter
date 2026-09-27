"use client";

import { Button } from "@startkiter/ui";
import { useState } from "react";

export function KitClaimButton({ className }: { className?: string }) {
	const [loading, setLoading] = useState(false);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function handleClaim() {
		if (loading) return;
		setLoading(true);
		setError(null);
		setStatusMessage(null);

		try {
			const res = await fetch("/api/github/claim", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json().catch(() => null);

			if (!res.ok) {
				setError(data?.error || "領取失敗，請確認已登入且符合資格。");
				return;
			}

			setStatusMessage(data?.message || "已成功送出邀請！請至 GitHub 接受邀請。");
		} catch {
			setError("網路錯誤，請稍後再試。");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="inline-flex flex-col gap-2">
			<Button
				data-testid="kit-claim-button"
				onClick={handleClaim}
				disabled={loading}
				className={className}
				variant="primary"
			>
				{loading ? "領取中..." : "領取代碼包"}
			</Button>
			{statusMessage && (
				<p className="text-sm text-emerald-600 dark:text-emerald-400">{statusMessage}</p>
			)}
			{error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
		</div>
	);
}
