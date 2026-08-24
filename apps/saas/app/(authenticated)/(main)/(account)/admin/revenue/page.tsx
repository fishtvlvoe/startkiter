import { Card, CardContent, CardHeader, CardTitle } from '@startkiter/ui'
import { ExportSpreadsheetButton } from '@admin/component/ExportSpreadsheetButton'
import { requireGlobalAdmin } from '../../../../../../lib/admin-access'

export default async function AdminRevenuePage() {
	await requireGlobalAdmin()
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-4">
				<CardTitle>營收結算</CardTitle>
				<ExportSpreadsheetButton endpoint="/api/export/revenue" />
			</CardHeader>
			<CardContent>營收結算以已付款訂單彙整。</CardContent>
		</Card>
	)
}
