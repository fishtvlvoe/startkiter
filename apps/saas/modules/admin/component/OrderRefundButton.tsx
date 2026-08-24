"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@startkiter/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { orpcClient } from "@shared/lib/orpc-client";

export function OrderRefundButton({ orderId }: { orderId: string }) {
	const router = useRouter();
	const [confirm, setConfirm] = useState(false);
	const refund = useMutation({
		mutationFn: () => orpcClient.course.refundOrder({ orderId }),
		onSuccess: () => {
			setConfirm(false);
			router.refresh();
		},
	});

	return confirm ? (
		<span className="flex items-center gap-2 text-xs">
			確認退款？
			<Button size="sm" variant="destructive" disabled={refund.isPending} onClick={() => refund.mutate()}>
				確認退款
			</Button>
			<Button size="sm" variant="outline" disabled={refund.isPending} onClick={() => setConfirm(false)}>
				取消
			</Button>
		</span>
	) : (
		<span>
			<Button size="sm" variant="outline" onClick={() => setConfirm(true)}>
				退款
			</Button>
			{refund.isError && <span className="ml-2 text-xs text-destructive">退款失敗</span>}
		</span>
	);
}
