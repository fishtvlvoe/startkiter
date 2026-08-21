import { Button } from '@startkiter/ui'
import { DownloadIcon } from 'lucide-react'

export function ExportSpreadsheetButton({ endpoint }: { endpoint: '/api/export/orders' | '/api/export/revenue' }) {
	return (
		<Button
			variant="outline"
			render={(props) => <a {...props} href={endpoint} download />}
		>
			<DownloadIcon className="size-4" />
			匯出活公式 Excel
		</Button>
	)
}
