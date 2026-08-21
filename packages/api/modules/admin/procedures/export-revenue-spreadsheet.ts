import { RevenueSpreadsheet, toXlsxBuffer } from '@startkiter/sheets'
import { z } from 'zod'

import { adminProcedure } from '../../../orpc/procedures'

const revenueExportItem = z.object({
	courseId: z.string(),
	title: z.string(),
	salesCount: z.number().int().nonnegative(),
	price: z.number().nonnegative(),
})

export const exportRevenueSpreadsheet = adminProcedure
	.route({ method: 'POST', path: '/admin/exports/revenue', tags: ['Administration'], summary: 'Export revenue spreadsheet' })
	.input(z.object({
		courses: z.array(revenueExportItem),
		platformFeeRate: z.number().optional(),
		taxRate: z.number().optional(),
	}))
	.output(z.object({ filename: z.string(), contentType: z.string(), data: z.string() }))
	.handler(async ({ input }) => {
		const buffer = await toXlsxBuffer(RevenueSpreadsheet({
			courses: input.courses,
			platformFeeRate: input.platformFeeRate,
			taxRate: input.taxRate,
		}))

		return {
			filename: 'revenue.xlsx',
			contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			data: buffer.toString('base64'),
		}
	})
