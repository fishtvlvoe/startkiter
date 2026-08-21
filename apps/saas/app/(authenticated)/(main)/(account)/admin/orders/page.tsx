import { Card, CardContent, CardHeader, CardTitle } from '@startkiter/ui'
import { ExportSpreadsheetButton } from '@admin/component/ExportSpreadsheetButton'

export default function AdminOrdersPage() {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-4">
				<CardTitle>訂單列表</CardTitle>
				<ExportSpreadsheetButton endpoint="/api/export/orders" />
			</CardHeader>
			<CardContent>訂單資料會由付款資料庫即時載入。</CardContent>
		</Card>
	)
}
