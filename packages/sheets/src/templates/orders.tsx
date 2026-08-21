import React from 'react'
import {
	Cell,
	col,
	mul,
	Row,
	Sheet,
	Stack,
	Table,
	Workbook,
} from '@open-sheet/core'

export interface OrderItem {
	id: string
	customerName?: string
	itemName: string
	qty: number
	unitPrice: number
	date?: string
}

export interface OrdersSheetProps {
	title?: string
	orders: OrderItem[]
}

export function OrdersSpreadsheet({
	title = '訂單銷售明細',
	orders,
}: OrdersSheetProps) {
	return (
		<Workbook>
			<Sheet name="訂單明細">
				<Stack gap={1}>
					<Row gap={1}>
						<Cell value={title} span={{ rows: 1, cols: 5 }} style="tableTitle" />
					</Row>

					<Table
						name="orders"
						data={orders}
						columns={[
							col('id', { header: '訂單編號', width: 16 }),
							col('customerName', { header: '客戶姓名', width: 14 }),
							col('itemName', { header: '購買項目', width: 24 }),
							col('qty', { header: '數量', format: 'number', width: 8 }),
							col('unitPrice', { header: '單價', format: 'currency', width: 12 }),
							col<OrderItem>('subtotal', {
								header: '金額小計',
								format: 'currency',
								width: 14,
								formula: (r) => mul(r.cell('qty'), r.cell('unitPrice')),
							}),
						]}
						total={{ subtotal: 'sum' }}
					/>
				</Stack>
			</Sheet>
		</Workbook>
	)
}
