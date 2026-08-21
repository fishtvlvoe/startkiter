/** @jsxImportSource @open-sheet/core */
import React from 'react'
import { Cell, col, div, mul, Row, Sheet, Stack, Table, Workbook } from '@open-sheet/core'

export interface BundleClaimItem {
	bundleId: string
	title: string
	purchaseCount: number
	claimCount: number
	price: number
}

export interface BundlesSheetProps {
	title?: string
	bundles: BundleClaimItem[]
}

/** 加值包／代碼庫領取統計；領取率與銷售額留給 Excel 重新計算。 */
export function BundlesSpreadsheet({
	title = '加值包／代碼庫領取統計',
	bundles,
}: BundlesSheetProps) {
	return (
		<Workbook>
			<Sheet name="加值包統計">
				<Stack gap={1}>
					<Row gap={1}>
						<Cell value={title} span={{ rows: 1, cols: 7 }} style="tableTitle" />
					</Row>

					<Table
						name="bundles"
						data={bundles}
						columns={[
							col('bundleId', { header: '加值包編號', width: 16 }),
							col('title', { header: '加值包名稱', width: 26 }),
							col('purchaseCount', { header: '購買數', format: 'number', width: 10 }),
							col('claimCount', { header: '領取數', format: 'number', width: 10 }),
							col<BundleClaimItem>('claimRate', {
								header: '領取率',
								format: 'percent',
								width: 12,
								formula: (r) => div(r.cell('claimCount'), r.cell('purchaseCount')),
							}),
							col('price', { header: '單價', format: 'currency', width: 12 }),
							col<BundleClaimItem>('salesAmount', {
								header: '銷售額',
								format: 'currency',
								width: 14,
								formula: (r) => mul(r.cell('purchaseCount'), r.cell('price')),
							}),
						]}
						total={{ purchaseCount: 'sum', claimCount: 'sum', salesAmount: 'sum' }}
					/>
				</Stack>
			</Sheet>
		</Workbook>
	)
}
