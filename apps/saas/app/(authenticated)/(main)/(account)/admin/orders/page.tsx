import { db } from "@startkiter/database";
import { sameTaiwanBillingMonth } from "@startkiter/api/modules/course/lib/taiwan-billing-month";
import { Card, CardContent, CardHeader, CardTitle } from "@startkiter/ui";

import { ExportSpreadsheetButton } from "@admin/component/ExportSpreadsheetButton";
import { InvoiceOperationsButtons } from "@admin/component/InvoiceOperationsButtons";
import { OrderRefundButton } from "@admin/component/OrderRefundButton";
import { requireGlobalAdmin } from "../../../../../../lib/admin-access";

export default async function AdminOrdersPage() {
	await requireGlobalAdmin();
	const [orders, subscriptionInvoices] = await Promise.all([
		db.order.findMany({
			orderBy: { createdAt: "desc" },
			take: 50,
			include: {
				invoice: true,
			},
		}),
		db.invoice.findMany({
			where: { orderId: null },
			orderBy: { createdAt: "desc" },
			take: 50,
			include: {
				subscription: { select: { gatewayTradeNo: true, pricePerPeriod: true } },
			},
		}),
	]);

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-4">
				<CardTitle>訂單列表</CardTitle>
				<ExportSpreadsheetButton endpoint="/api/export/orders" />
			</CardHeader>
			<CardContent className="space-y-6">
				{orders.length === 0 ? (
					<p className="text-sm text-muted-foreground">目前沒有訂單紀錄。</p>
				) : (
					<div className="space-y-3">
						{orders.map((order) => {
							const invoice = order.invoice;
							const canVoid = Boolean(
								invoice?.status === "ISSUED" &&
								invoice.invoiceDate &&
								sameTaiwanBillingMonth(invoice.invoiceDate, new Date()),
							);

							return (
								<div key={order.id} className="rounded-xl border p-4">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div>
											<p className="font-medium">{order.orderNo}</p>
											<p className="text-sm text-muted-foreground">
												{order.status} · {order.sku} · NT$ {order.amount.toLocaleString()}
											</p>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											{invoice ? <span className="text-sm">發票：{invoice.status}</span> : <span className="text-sm text-muted-foreground">尚未開票</span>}
											{order.status === "paid" && <OrderRefundButton orderId={order.id} />}
										</div>
									</div>
									{invoice && (
										<div className="mt-3 space-y-2 border-t pt-3">
											<p className="text-sm">
												{invoice.invoiceNumber ?? "尚未取得發票號碼"} · {invoice.provider} · NT$ {invoice.amount.toLocaleString()}
											</p>
											{invoice.attentionReason && <p className="text-sm text-amber-700">發票作業待處理：{invoice.attentionReason}</p>}
											<InvoiceOperationsButtons
												invoice={{
													id: invoice.id,
													status: invoice.status,
													amount: invoice.amount,
													allowanceTotal: invoice.allowanceTotal,
													invoiceDate: invoice.invoiceDate,
									canVoid,
									attentionReason: invoice.attentionReason,
												failReason: invoice.failReason,
												}}
											/>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}

				{subscriptionInvoices.length > 0 && (
					<section className="space-y-3 border-t pt-4">
						<h2 className="font-medium">訂閱期款發票</h2>
						{subscriptionInvoices.map((invoice) => (
							<div key={invoice.id} className="rounded-xl border p-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<p className="font-medium">{invoice.invoiceNumber ?? "尚未取得發票號碼"}</p>
										<p className="text-sm text-muted-foreground">
											{invoice.subscription?.gatewayTradeNo ?? invoice.id} · {invoice.provider} · {invoice.status}
										</p>
									</div>
									<span className="text-sm">NT$ {invoice.amount.toLocaleString()}</span>
								</div>
								{invoice.attentionReason && <p className="mt-2 text-sm text-amber-700">發票作業待處理：{invoice.attentionReason}</p>}
								<div className="mt-3">
									<InvoiceOperationsButtons
										invoice={{
											id: invoice.id,
											status: invoice.status,
											amount: invoice.amount,
											allowanceTotal: invoice.allowanceTotal,
											invoiceDate: invoice.invoiceDate,
									canVoid: Boolean(
											invoice.status === "ISSUED" &&
											invoice.invoiceDate &&
											sameTaiwanBillingMonth(invoice.invoiceDate, new Date()),
										),
										attentionReason: invoice.attentionReason,
										failReason: invoice.failReason,
										}}
									/>
								</div>
							</div>
						))}
					</section>
				)}
			</CardContent>
		</Card>
	);
}
