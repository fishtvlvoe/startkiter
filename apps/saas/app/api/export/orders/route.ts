import { exportOrdersSpreadsheet } from '@startkiter/api/modules/admin/procedures/export-orders-spreadsheet'
import { auth } from '@startkiter/auth'
import { db } from '@startkiter/database'
import { checkPermission } from '@startkiter/permissions'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
	if (!checkPermission({ user: session.user }, 'admin.access')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

	const orders = await db.order.findMany({
		orderBy: { createdAt: 'desc' },
		include: { user: { select: { name: true, email: true } } },
	})
	const result = await exportOrdersSpreadsheet.callable({ context: { headers: request.headers } })({
		orders: orders.map((order) => ({
			orderNo: order.orderNo,
			customerName: order.user.name || order.user.email || undefined,
			sku: order.sku,
			amount: order.amount,
			status: order.status,
		})),
	})
	return new Response(Buffer.from(result.data, 'base64'), {
		status: 200,
		headers: {
			'Content-Type': result.contentType,
			'Content-Disposition': `attachment; filename="${result.filename}"`,
		},
	})
}
