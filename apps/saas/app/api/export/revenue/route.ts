import { exportRevenueSpreadsheet } from '@startkiter/api/modules/admin/procedures/export-revenue-spreadsheet'
import { auth } from '@startkiter/auth'
import { db } from '@startkiter/database'
import { checkPermission } from '@startkiter/permissions'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
	if (!checkPermission({ user: session.user }, 'admin.access')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

	const orders = await db.order.findMany({ where: { status: 'paid' }, orderBy: { createdAt: 'desc' } })
	const grouped = new Map<string, { salesCount: number; price: number }>()
	for (const order of orders) {
		const current = grouped.get(order.sku) ?? { salesCount: 0, price: order.amount }
		current.salesCount += 1
		grouped.set(order.sku, current)
	}
	const result = await exportRevenueSpreadsheet.callable({ context: { headers: request.headers } })({
		courses: [...grouped].map(([courseId, value]) => ({ courseId, title: courseId, ...value })),
	})
	return new Response(Buffer.from(result.data, 'base64'), {
		status: 200,
		headers: {
			'Content-Type': result.contentType,
			'Content-Disposition': `attachment; filename="${result.filename}"`,
		},
	})
}
