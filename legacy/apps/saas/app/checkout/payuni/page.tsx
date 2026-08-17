"use client";

import { useEffect, useMemo, useState } from "react";

type PayuniPayment = {
	type: string;
	formData: {
		apiUrl: string;
		MerID: string;
		Version: string;
		EncryptInfo: string;
		HashInfo: string;
	};
};

export default function PayuniCheckoutResultPage() {
	const [payment, setPayment] = useState<PayuniPayment | null>(null);

	useEffect(() => {
		const raw = sessionStorage.getItem("payuniCheckout");
		if (!raw) {
			return;
		}
		setPayment(JSON.parse(raw) as PayuniPayment);
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

	if (!payment) {
		return (
			<main>
				<section className="panel">
					<h1>找不到付款資料</h1>
					<p className="muted">請回到結帳頁重新建立訂單。</p>
				</section>
			</main>
		);
	}

	return (
		<main>
			<section className="panel">
				<h1>前往 PAYUNi 付款</h1>
				<p className="muted">送出後會導向 PAYUNi（form_post）。</p>
				<form action={payment.formData.apiUrl} method="post">
					{fields.map(([name, value]) => (
						<input key={name} type="hidden" name={name} value={value} />
					))}
					<button className="button" type="submit">
						送出付款表單
					</button>
				</form>
				<p className="muted">apiUrl: {payment.formData.apiUrl}</p>
			</section>
		</main>
	);
}
