"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CheckoutButton() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function startCheckout() {
		setLoading(true);
		setError(null);
		const response = await fetch("/api/checkout", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ sku: "startkiter-mvp" }),
		});

		if (response.status === 401) {
			router.push("/login");
			return;
		}

		if (!response.ok) {
			const payload = (await response.json().catch(() => ({}))) as { error?: string };
			setError(payload.error || `結帳失敗（${response.status}）`);
			setLoading(false);
			return;
		}

		const payload = (await response.json()) as {
			payment: {
				type: string;
				formData: {
					apiUrl: string;
					MerID: string;
					Version: string;
					EncryptInfo: string;
					HashInfo: string;
				};
			};
		};

		sessionStorage.setItem("payuniCheckout", JSON.stringify(payload.payment));
		router.push("/checkout/payuni");
	}

	return (
		<div className="actions">
			<button className="button" type="button" disabled={loading} onClick={startCheckout}>
				{loading ? "建立訂單中…" : "購買開站包 NT$8800"}
			</button>
			{error ? <p className="muted">{error}</p> : null}
		</div>
	);
}
