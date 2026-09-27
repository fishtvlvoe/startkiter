import { exportBundlesSpreadsheet } from '@startkiter/api/modules/admin/procedures/export-bundles-spreadsheet'
import { auth } from '@startkiter/auth'
import { db } from '@startkiter/database'
import { checkPermission } from '@startkiter/permissions'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
	if (!checkPermission({ user: session.user }, 'admin.access')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

	const bundles = await db.bundle.findMany({
		orderBy: { createdAt: 'desc' },
	})

	const orders = bundles.length === 0 ? [] : await db.order.findMany({
		where: { sku: { in: bundles.map((b) => b.slug) }, status: 'paid' },
		select: { sku: true, kitClaimEligible: true },
	})

	const bundleItems = bundles.map((bundle) => {
		const bundleOrders = orders.filter((o) => o.sku === bundle.slug)
		return {
			bundleId: bundle.id,
			title: bundle.title,
			purchaseCount: bundleOrders.length,
			claimCount: bundleOrders.filter((o) => !o.kitClaimEligible).length,
			price: bundle.priceTwd,
		}
	})

	const result = await exportBundlesSpreadsheet.callable({ context: { headers: request.headers } })({
		bundles: bundleItems,
	})

	return new Response(Buffer.from(result.data, 'base64'), {
		status: 200,
		headers: {
			'Content-Type': result.contentType,
			'Content-Disposition': `attachment; filename="${result.filename}"`,
		},
	})
}
