"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCouponForm() {
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const form = e.currentTarget;
		setError(null);
		setSubmitting(true);
		const formData = new FormData(form);
		const amountOffRaw = formData.get("amountOff");
		const percentOffRaw = formData.get("percentOff");
		try {
			const res = await fetch("/api/coupons", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					code: formData.get("code"),
					discountType: formData.get("discountType"),
					amountOff: amountOffRaw ? Number(amountOffRaw) : null,
					percentOff: percentOffRaw ? Number(percentOffRaw) : null,
				}),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(typeof data.error === "string" ? data.error : `建立失敗（HTTP ${res.status}）`);
				return;
			}
			form.reset();
			router.refresh();
		} catch {
			setError("網路錯誤，請稍後再試。");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div>
				<label className="block text-sm font-medium text-body" htmlFor="code">優惠碼</label>
				<input id="code" name="code" type="text" required placeholder="例如 SAVE100" className="mt-1 block w-full rounded border border-divider p-2 text-sm" />
			</div>
			<div>
				<label className="block text-sm font-medium text-body" htmlFor="discountType">折扣類型</label>
				<select id="discountType" name="discountType" className="mt-1 block w-full rounded border border-divider p-2 text-sm">
					<option value="amount">固定金額 (NT$)</option>
					<option value="percent">百分比 (%)</option>
				</select>
			</div>
			<div>
				<label className="block text-sm font-medium text-body" htmlFor="amountOff">折抵金額</label>
				<input id="amountOff" name="amountOff" type="number" min="1" placeholder="例如 100" className="mt-1 block w-full rounded border border-divider p-2 text-sm" />
			</div>
			<div>
				<label className="block text-sm font-medium text-body" htmlFor="percentOff">折扣百分比</label>
				<input id="percentOff" name="percentOff" type="number" min="1" max="100" placeholder="例如 20" className="mt-1 block w-full rounded border border-divider p-2 text-sm" />
			</div>
			{error && (
				<div className="sm:col-span-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>
			)}
			<div className="sm:col-span-2">
				<button type="submit" disabled={submitting} className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
					{submitting ? "建立中..." : "建立優惠券"}
				</button>
			</div>
		</form>
	);
}
