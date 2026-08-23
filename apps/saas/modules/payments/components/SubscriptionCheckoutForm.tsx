"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@startkiter/ui";
import { useState } from "react";

import { orpcClient } from "@shared/lib/orpc-client";

type SubscriptionPlanOption = {
	id: string;
	label: string;
	interval: "MONTH" | "YEAR";
	price: number;
	courseTitle: string;
};

type Payment = {
	formData: {
		apiUrl: string;
		MerID: string;
		Version: string;
		EncryptInfo: string;
		HashInfo: string;
	};
};

export function SubscriptionCheckoutForm({ plans }: { plans: SubscriptionPlanOption[] }) {
	const [planId, setPlanId] = useState(plans[0]?.id ?? "");
	const [payment, setPayment] = useState<Payment | null>(null);
	const checkout = useMutation({
		mutationFn: (selectedPlanId: string) => orpcClient.course.createSubscriptionCheckout({ planId: selectedPlanId }),
		onSuccess: (result) => setPayment(result.payment),
	});

	if (plans.length === 0) {
		return <p className="text-sm text-muted-foreground">目前沒有可用的訂閱方案。</p>;
	}

	if (payment) {
		return (
			<form action={payment.formData.apiUrl} method="post" className="space-y-4">
				{(["MerID", "Version", "EncryptInfo", "HashInfo"] as const).map((field) => (
					<input key={field} type="hidden" name={field} value={payment.formData[field]} />
				))}
				<p className="text-sm">訂閱資料已建立，送出表單後前往 PAYUNi 完成首期授權。</p>
				<Button type="submit">前往 PAYUNi</Button>
			</form>
		);
	}

	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				checkout.mutate(planId);
			}}
		>
			<label className="grid gap-2 text-sm">
				<span>訂閱方案</span>
				<select
					className="border-input bg-background h-9 rounded-md border px-3"
					value={planId}
					onChange={(event) => setPlanId(event.target.value)}
				>
					{plans.map((plan) => (
						<option key={plan.id} value={plan.id}>
							{plan.courseTitle}｜{plan.label}｜TWD {plan.price.toLocaleString()}
						</option>
					))}
				</select>
			</label>
			{checkout.isError && <p className="text-sm text-destructive">訂閱建立失敗，請稍後再試。</p>}
			<Button type="submit" disabled={!planId || checkout.isPending}>
				{checkout.isPending ? "建立中…" : "建立訂閱"}
			</Button>
		</form>
	);
}
