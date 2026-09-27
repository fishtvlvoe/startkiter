import { exportCouponsSpreadsheet } from '@startkiter/api/modules/admin/procedures/export-coupons-spreadsheet'
import { auth } from '@startkiter/auth'
import { db } from '@startkiter/database'
import { checkPermission } from '@startkiter/permissions'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
	if (!checkPermission({ user: session.user }, 'admin.access')) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

	const coupons = await db.coupon.findMany({
		orderBy: { createdAt: 'desc' },
		include: {
			orders: {
				where: { status: 'paid' },
				select: { amount: true },
			},
		},
	})

	const couponItems = coupons.map((coupon) => {
		const totalOrderAmount = coupon.orders.reduce((sum, o) => sum + o.amount, 0)
		let totalDiscountAmount = 0
		if (coupon.discountType === 'amount') {
			totalDiscountAmount = (coupon.amountOff ?? 0) * coupon.timesRedeemed
		} else if (coupon.discountType === 'percent') {
			totalDiscountAmount = coupon.orders.reduce((sum, o) => {
				const pct = coupon.percentOff ?? 0
				if (pct <= 0 || pct >= 100) return sum
				const original = o.amount / (1 - pct / 100)
				const discount = Math.round(original - o.amount)
				return sum + (coupon.maxDiscountAmount ? Math.min(discount, coupon.maxDiscountAmount) : discount)
			}, 0)
		}

		return {
			couponId: coupon.id,
			code: coupon.code,
			discountType: coupon.discountType,
			timesRedeemed: coupon.timesRedeemed,
			totalDiscountAmount,
			totalOrderAmount,
		}
	})

	const result = await exportCouponsSpreadsheet.callable({ context: { headers: request.headers } })({
		coupons: couponItems,
	})

	return new Response(Buffer.from(result.data, 'base64'), {
		status: 200,
		headers: {
			'Content-Type': result.contentType,
			'Content-Disposition': `attachment; filename="${result.filename}"`,
		},
	})
}
