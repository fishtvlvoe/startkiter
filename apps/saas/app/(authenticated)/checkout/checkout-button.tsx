"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InvoicePreferenceFields, DEFAULT_INVOICE_PREFERENCE } from "@payments/components/InvoicePreferenceFields";
import type { CheckoutPaymentSessionResult, InvoicePreferenceInput } from "@startkiter/payments";
import { Button, Input } from "@startkiter/ui";

function checkoutErrorMessage(status: number, code?: string, reason?: string) {
	if (code === "invalid_coupon") {
		if (reason === "expired") return "此優惠券已過期。";
		if (reason === "not_started") return "此優惠券活動尚未開始。";
		if (reason === "max_redemptions_reached") return "此優惠券已達兌換次數上限。";
		return "無效的優惠券代碼。";
	}
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

type AppliedCoupon = {
	code: string;
	discountAmount: number;
	finalAmount: number;
};

export function CheckoutButton() {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [invoicePreference, setInvoicePreference] = useState<InvoicePreferenceInput>(DEFAULT_INVOICE_PREFERENCE);

	const [couponInput, setCouponInput] = useState("");
	const [couponValidating, setCouponValidating] = useState(false);
	const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
	const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

	async function handleApplyCoupon() {
		const code = couponInput.trim();
		if (!code) {
			setAppliedCoupon(null);
			setCouponMessage(null);
			return;
		}
		setCouponValidating(true);
		setCouponMessage(null);
		try {
			const res = await fetch("/api/coupons/validate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ code, productId: "startkiter-mvp" }),
			});
			if (!res.ok) {
				if (res.status === 429) {
					setCouponMessage({ type: "error", text: "驗證次數過於頻繁，請稍後再試。" });
				} else {
					setCouponMessage({ type: "error", text: "優惠券驗證失敗。" });
				}
				setAppliedCoupon(null);
				return;
			}
			const data = (await res.json()) as { valid: boolean; discountAmount?: number; finalAmount?: number; reason?: string };
			if (data.valid && typeof data.discountAmount === "number" && typeof data.finalAmount === "number") {
				setAppliedCoupon({
					code,
					discountAmount: data.discountAmount,
					finalAmount: data.finalAmount,
				});
				setCouponMessage({
					type: "success",
					text: `已套用優惠券「${code}」：折抵 NT$${data.discountAmount.toLocaleString()}，實付金額 NT$${data.finalAmount.toLocaleString()}`,
				});
			} else {
				setAppliedCoupon(null);
				if (data.reason === "expired") {
					setCouponMessage({ type: "error", text: "此優惠券已過期。" });
				} else if (data.reason === "not_started") {
					setCouponMessage({ type: "error", text: "此優惠券活動尚未開始。" });
				} else if (data.reason === "max_redemptions_reached") {
					setCouponMessage({ type: "error", text: "此優惠券已達兌換次數上限。" });
				} else {
					setCouponMessage({ type: "error", text: "找不到此優惠券或代碼無效。" });
				}
			}
		} catch {
			setCouponMessage({ type: "error", text: "網路連線異常，請稍後再試。" });
		} finally {
			setCouponValidating(false);
		}
	}

	function handleRemoveCoupon() {
		setCouponInput("");
		setAppliedCoupon(null);
		setCouponMessage(null);
	}

	async function startCheckout() {
		setLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/checkout", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					sku: "startkiter-mvp",
					invoicePreference,
					couponCode: appliedCoupon?.code,
				}),
			});

			if (response.status === 401) {
				router.push("/login?next=/checkout");
				return;
			}

			if (!response.ok) {
				const payload = (await response.json().catch(() => ({}))) as { error?: string; reason?: string };
				setError(checkoutErrorMessage(response.status, payload.error, payload.reason));
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

	const displayAmount = appliedCoupon ? appliedCoupon.finalAmount : 8800;

	return (
		<div className="space-y-4">
			<InvoicePreferenceFields value={invoicePreference} onChange={setInvoicePreference} />

			<div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-3">
				<label className="text-xs font-medium text-muted-foreground" htmlFor="coupon-code-input">
					優惠券代碼（選填）
				</label>
				<div className="flex gap-2">
					<Input
						id="coupon-code-input"
						placeholder="輸入優惠碼，例如 TESTMAX1"
						value={couponInput}
						disabled={couponValidating || Boolean(appliedCoupon)}
						onChange={(e) => setCouponInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								void handleApplyCoupon();
							}
						}}
					/>
					{appliedCoupon ? (
						<Button type="button" variant="outline" size="sm" onClick={handleRemoveCoupon}>
							清除
						</Button>
					) : (
						<Button
							type="button"
							variant="secondary"
							size="sm"
							disabled={couponValidating || !couponInput.trim()}
							onClick={() => void handleApplyCoupon()}
						>
							{couponValidating ? "驗證中…" : "套用"}
						</Button>
					)}
				</div>
				{couponMessage ? (
					<p
						className={`text-xs ${
							couponMessage.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
						}`}
					>
						{couponMessage.text}
					</p>
				) : null}
			</div>

			<button
				className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 w-full"
				type="button"
				disabled={loading}
				onClick={() => void startCheckout()}
			>
				{loading ? "建立訂單中…" : `購買開站包 NT$${displayAmount.toLocaleString()}`}
			</button>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	);
}

