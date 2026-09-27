import { BundlesSpreadsheet, toXlsxBuffer } from '@startkiter/sheets'
import { z } from 'zod'

import { adminProcedure } from '../../../orpc/procedures'

const bundleExportItem = z.object({
	bundleId: z.string(),
	title: z.string(),
	purchaseCount: z.number(),
	claimCount: z.number(),
	price: z.number(),
})

export const exportBundlesSpreadsheet = adminProcedure
	.route({ method: 'POST', path: '/admin/exports/bundles', tags: ['Administration'], summary: 'Export bundles spreadsheet' })
	.input(z.object({ bundles: z.array(bundleExportItem) }))
	.output(z.object({ filename: z.string(), contentType: z.string(), data: z.string() }))
	.handler(async ({ input }) => {
		const buffer = await toXlsxBuffer(BundlesSpreadsheet({
			bundles: input.bundles,
		}))

		return {
			filename: 'bundles.xlsx',
			contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			data: buffer.toString('base64'),
		}
	})
