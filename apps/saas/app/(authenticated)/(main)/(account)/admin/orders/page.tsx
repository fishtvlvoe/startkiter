import { db } from "@startkiter/database";
import { Card, CardContent, CardHeader, CardTitle } from "@startkiter/ui";

import { InvoiceOperationsButtons } from "@admin/component/InvoiceOperationsButtons";

export default async function AdminOrdersPage() {
	const invoices = await db.invoice.findMany({
		orderBy: { createdAt: "desc" },
		take: 50,
		include: {
			order: { select: { orderNo: true, amount: true } },
			subscription: { select: { gatewayTradeNo: true, pricePerPeriod: true, paidPeriods: true } },
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>訂單與發票</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{invoices.length === 0 ? (
					<p className="text-sm text-muted-foreground">目前沒有發票紀錄。</p>
				) : (
					<div className="space-y-3">
						{invoices.map((invoice) => (
							<div key={invoice.id} className="rounded-xl border p-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<p className="font-medium">{invoice.invoiceNumber ?? "尚未取得發票號碼"}</p>
										<p className="text-sm text-muted-foreground">
											{invoice.order?.orderNo ?? invoice.subscription?.gatewayTradeNo ?? invoice.id} · {invoice.provider} · {invoice.status}
										</p>
									</div>
									<span className="text-sm">NT$ {invoice.amount.toLocaleString()}</span>
								</div>
								{invoice.attentionReason && <p className="mt-2 text-sm text-amber-700">退款但發票待處理：請改用折讓。</p>}
								<div className="mt-3">
									<InvoiceOperationsButtons invoice={{ id: invoice.id, status: invoice.status, amount: invoice.amount, allowanceTotal: invoice.allowanceTotal, invoiceDate: invoice.invoiceDate }} />
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
