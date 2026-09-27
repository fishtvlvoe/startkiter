import { CouponsSpreadsheet, toXlsxBuffer } from '@startkiter/sheets'
import { z } from 'zod'

import { adminProcedure } from '../../../orpc/procedures'

const couponExportItem = z.object({
	couponId: z.string(),
	code: z.string(),
	discountType: z.string(),
	timesRedeemed: z.number(),
	totalDiscountAmount: z.number(),
	totalOrderAmount: z.number(),
})

export const exportCouponsSpreadsheet = adminProcedure
	.route({ method: 'POST', path: '/admin/exports/coupons', tags: ['Administration'], summary: 'Export coupons spreadsheet' })
	.input(z.object({ coupons: z.array(couponExportItem) }))
	.output(z.object({ filename: z.string(), contentType: z.string(), data: z.string() }))
	.handler(async ({ input }) => {
		const buffer = await toXlsxBuffer(CouponsSpreadsheet({
			coupons: input.coupons,
		}))

		return {
			filename: 'coupons.xlsx',
			contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			data: buffer.toString('base64'),
		}
	})
