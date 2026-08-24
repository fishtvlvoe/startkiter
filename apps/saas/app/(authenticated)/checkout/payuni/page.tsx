"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@startkiter/ui";

type PayuniPayment = {
	orderNo: string;
	type: string;
	formData: {
		apiUrl: string;
		MerID: string;
		Version: string;
		EncryptInfo: string;
		HashInfo: string;
	};
};

export default function PayuniCheckoutPage() {
	const [payment, setPayment] = useState<PayuniPayment | null>(null);

	useEffect(() => {
		const raw = sessionStorage.getItem("payuniCheckout");
		if (!raw) {
			return;
		}

		try {
			setPayment(JSON.parse(raw) as PayuniPayment);
		} catch {
			sessionStorage.removeItem("payuniCheckout");
		}
	}, []);

	const fields = useMemo(() => {
		if (!payment) {
			return [];
		}

		return [
			["MerID", payment.formData.MerID],
			["Version", payment.formData.Version],
			["EncryptInfo", payment.formData.EncryptInfo],
			["HashInfo", payment.formData.HashInfo],
		] as const;
	}, [payment]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{payment ? "前往 PAYUNi 付款" : "找不到付款資料"}</CardTitle>
				<CardDescription>
					{payment ? `訂單 ${payment.orderNo} 已保存發票偏好，送出後會導向 PAYUNi（form_post）。` : "請回到結帳頁重新建立訂單。"}
				</CardDescription>
			</CardHeader>
			{payment && (
				<CardContent className="space-y-4">
					<form action={payment.formData.apiUrl} method="post">
						{fields.map(([name, value]) => (
							<input key={name} type="hidden" name={name} value={value} />
						))}
						<button
							className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors"
							type="submit"
						>
							送出付款表單
						</button>
					</form>
					<p className="text-xs text-muted-foreground">付款服務：{payment.formData.apiUrl}</p>
				</CardContent>
			)}
		</Card>
	);
}
