import { OrdersSpreadsheet, toXlsxBuffer } from '@startkiter/sheets'
import { z } from 'zod'

import { adminProcedure } from '../../../orpc/procedures'

const orderExportItem = z.object({
	orderNo: z.string(),
	customerName: z.string().optional(),
	sku: z.string(),
	amount: z.number(),
	status: z.string(),
})

export const exportOrdersSpreadsheet = adminProcedure
	.route({ method: 'POST', path: '/admin/exports/orders', tags: ['Administration'], summary: 'Export order spreadsheet' })
	.input(z.object({ orders: z.array(orderExportItem) }))
	.output(z.object({ filename: z.string(), contentType: z.string(), data: z.string() }))
	.handler(async ({ input }) => {
		const buffer = await toXlsxBuffer(OrdersSpreadsheet({
			orders: input.orders.map((order) => ({
				id: order.orderNo,
				customerName: order.customerName,
				itemName: order.sku,
				qty: 1,
				unitPrice: order.amount,
			})),
		}))

		return {
			filename: 'orders.xlsx',
			contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			data: buffer.toString('base64'),
		}
	})
