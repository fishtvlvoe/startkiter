"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@startkiter/ui";
import { useState } from "react";

import { orpcClient } from "@shared/lib/orpc-client";

type SubscriptionItem = {
	id: string;
	courseTitle: string;
	label: string;
	interval: "MONTH" | "YEAR";
	price: number;
	status: "PENDING" | "ACTIVE" | "CANCELED";
};

export function SubscriptionCancellationList({ subscriptions }: { subscriptions: SubscriptionItem[] }) {
	const [items, setItems] = useState(subscriptions);
	const cancel = useMutation({
		mutationFn: (subscriptionId: string) => orpcClient.course.cancelCourseSubscription({ subscriptionId }),
		onSuccess: (_, subscriptionId) => {
			setItems((current) =>
				current.map((item) => (item.id === subscriptionId ? { ...item, status: "CANCELED" } : item)),
			);
		},
	});

	if (items.length === 0) return null;

	return (
		<div className="grid gap-3">
			{items.map((subscription) => (
				<div key={subscription.id} className="rounded-lg border p-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<p className="font-medium">{subscription.courseTitle}</p>
							<p className="text-sm text-muted-foreground">
								{subscription.label} · TWD {subscription.price.toLocaleString()} / {subscription.interval === "MONTH" ? "月" : "年"}
							</p>
						</div>
						{subscription.status === "CANCELED" ? (
							<span className="text-sm text-muted-foreground">已取消</span>
						) : (
							<Button
								type="button"
								variant="outline"
								disabled={cancel.isPending}
								onClick={() => cancel.mutate(subscription.id)}
							>
								取消訂閱
							</Button>
						)}
					</div>
				</div>
			))}
			{cancel.isError && <p className="text-sm text-destructive">取消失敗，訂閱狀態沒有變更。</p>}
		</div>
	);
}
