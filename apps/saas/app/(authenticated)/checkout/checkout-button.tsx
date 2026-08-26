"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InvoicePreferenceFields, DEFAULT_INVOICE_PREFERENCE } from "@payments/components/InvoicePreferenceFields";
import type { CheckoutPaymentSessionResult, InvoicePreferenceInput } from "@startkiter/payments";

function checkoutErrorMessage(status: number, code?: string) {
	if (code === "public_base_url_required") {
		return "站台公開網址尚未設定，暫時無法結帳。";
	}
	if (status === 503 || code === "payuni_not_configured" || code === "checkout_gateway_not_configured" || code === "checkout_gateway_unavailable") {
		return "金流尚未設定完成，暫時無法結帳。";
	}
	if (status === 401) {
		return "請先登入再結帳。";
	}
	return "結帳失敗，請稍後再試。";
}

type CheckoutResponse = {
	orderNo: string;
	payment: CheckoutPaymentSessionResult;
};

export function CheckoutButton() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [invoicePreference, setInvoicePreference] = useState<InvoicePreferenceInput>(DEFAULT_INVOICE_PREFERENCE);

	async function startCheckout() {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/checkout", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ sku: "startkiter-mvp", invoicePreference }),
			});

			if (response.status === 401) {
				router.push("/login?next=/checkout");
				return;
			}

			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { error?: string };
				setError(checkoutErrorMessage(response.status, payload.error));
				return;
			}

			const payload = (await response.json()) as CheckoutResponse;
			if (payload.payment.type === "redirect") {
				window.location.assign(payload.payment.checkoutUrl);
				return;
			}
			sessionStorage.setItem("payuniCheckout", JSON.stringify({ ...payload.payment, orderNo: payload.orderNo }));
			router.push("/checkout/payuni");
		} catch {
			setError("網路異常，請稍後再試。");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="space-y-2">
			<InvoicePreferenceFields value={invoicePreference} onChange={setInvoicePreference} />
			<button
				className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50"
				type="button"
				disabled={loading}
				onClick={() => void startCheckout()}
			>
				{loading ? "建立訂單中…" : "購買開站包 NT$8,800"}
			</button>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	);
}
