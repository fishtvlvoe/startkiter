"use client";

import { createPurchasesHelper } from "@startkiter/payments/lib/helper";
import { Spinner } from "@startkiter/ui/components/spinner";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MAX_WAIT_MS = 20_000;
const POLL_INTERVAL_MS = 2_000;

type CheckoutOrderStatus = {
	orderNo: string;
	status: "pending" | "paid" | "refunded";
};

export function CheckoutReturnContent({ organizationId, orderNo }: { organizationId?: string; orderNo?: string }) {
	const t = useTranslations("checkoutReturn");
	const router = useRouter();
	const [polling, setPolling] = useState(true);

	const { data: purchases } = useQuery({
		...orpc.payments.listPurchases.queryOptions({
			input: { organizationId },
		}),
		enabled: !orderNo,
		refetchInterval: polling ? POLL_INTERVAL_MS : false,
	});

	const { data: orderStatus } = useQuery<CheckoutOrderStatus>({
		queryKey: ["checkout-order-status", orderNo],
		queryFn: async () => {
			const response = await fetch(`/api/checkout/status?orderNo=${encodeURIComponent(orderNo ?? "")}`, {
				cache: "no-store",
			});
			if (!response.ok) throw new Error("checkout order status unavailable");
			return response.json() as Promise<CheckoutOrderStatus>;
		},
		enabled: Boolean(orderNo),
		refetchInterval: Boolean(orderNo) && polling ? POLL_INTERVAL_MS : false,
		retry: false,
	});

	const { activePlan } = createPurchasesHelper(purchases ?? []);
	const paymentCompleted = orderNo ? orderStatus?.status === "paid" : Boolean(activePlan);

	useEffect(() => {
		if (paymentCompleted) {
			setPolling(false);
			router.replace("/");
		}
	}, [paymentCompleted, router]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setPolling(false);
			router.replace("/choose-plan");
		}, MAX_WAIT_MS);

		return () => clearTimeout(timer);
	}, [router]);

	return (
		<div className="gap-4 py-8 flex flex-col items-center justify-center">
			<Spinner className="size-8" />
			<p className="text-sm text-center text-muted-foreground">{t("loading")}</p>
		</div>
	);
}
