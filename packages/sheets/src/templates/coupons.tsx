/** @jsxImportSource @open-sheet/core */
import React from 'react'
import { Cell, col, div, Row, Sheet, Stack, Table, Workbook } from '@open-sheet/core'

export interface CouponEffectivenessItem {
	couponId: string
	code: string
	discountType: string
	timesRedeemed: number
	totalDiscountAmount: number
	totalOrderAmount: number
}

export interface CouponsSheetProps {
	title?: string
	coupons: CouponEffectivenessItem[]
}

/** 優惠券折抵效益分析；平均折抵與折抵率保持為活公式。 */
export function CouponsSpreadsheet({
	title = '優惠券折抵效益分析',
	coupons,
}: CouponsSheetProps) {
	return (
		<Workbook>
			<Sheet name="優惠券效益">
				<Stack gap={1}>
					<Row gap={1}>
						<Cell value={title} span={{ rows: 1, cols: 8 }} style="tableTitle" />
					</Row>

					<Table
						name="coupons"
						data={coupons}
						columns={[
							col('couponId', { header: '優惠券編號', width: 16 }),
							col('code', { header: '優惠碼', width: 18 }),
							col('discountType', { header: '折扣類型', width: 12 }),
							col('timesRedeemed', { header: '使用次數', format: 'number', width: 10 }),
							col('totalDiscountAmount', { header: '折抵總額', format: 'currency', width: 14 }),
							col<CouponEffectivenessItem>('averageDiscount', {
								header: '平均折抵',
								format: 'currency',
								width: 14,
								formula: (r) => div(r.cell('totalDiscountAmount'), r.cell('timesRedeemed')),
							}),
							col('totalOrderAmount', { header: '折扣前訂單額', format: 'currency', width: 16 }),
							col<CouponEffectivenessItem>('discountRate', {
								header: '折抵率',
								format: 'percent',
								width: 12,
								formula: (r) => div(r.cell('totalDiscountAmount'), r.cell('totalOrderAmount')),
							}),
						]}
						total={{ timesRedeemed: 'sum', totalDiscountAmount: 'sum', totalOrderAmount: 'sum' }}
					/>
				</Stack>
			</Sheet>
		</Workbook>
	)
}
