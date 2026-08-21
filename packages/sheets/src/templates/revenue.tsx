/** @jsxImportSource @open-sheet/core */
import React from 'react'
import {
	Cell,
	col,
	mul,
	ref,
	round,
	Row,
	Sheet,
	Stack,
	sub,
	sum,
	Table,
	Workbook,
} from '@open-sheet/core'

export interface CourseRevenueItem {
	courseId: string
	title: string
	salesCount: number
	price: number
}

export interface RevenueSheetProps {
	title?: string
	platformFeeRate?: number
	taxRate?: number
	courses: CourseRevenueItem[]
}

export function RevenueSpreadsheet({
	title = '課程營收結算表',
	platformFeeRate = 0.15,
	taxRate = 0.05,
	courses,
}: RevenueSheetProps) {
	return (
		<Workbook>
			<Sheet name="參數設定">
				<Table
					name="assumptions"
					kind="keyValue"
					title="結算費率假設"
					data={[
						{
							key: 'platformFeeRate',
							label: '平台手續費率',
							value: platformFeeRate,
							format: 'percent',
						},
						{
							key: 'taxRate',
							label: '營業稅率',
							value: taxRate,
							format: 'percent',
						},
					]}
				/>
			</Sheet>

			<Sheet name="營收結算">
				<Stack gap={1}>
					<Row gap={1}>
						<Cell value={title} span={{ rows: 1, cols: 5 }} style="tableTitle" />
					</Row>

					<Table
						name="courses"
						data={courses}
						columns={[
							col('courseId', { header: '課程編號', width: 14 }),
							col('title', { header: '課程名稱', width: 26 }),
							col('salesCount', { header: '銷售堂數', format: 'number', width: 10 }),
							col('price', { header: '單價', format: 'currency', width: 12 }),
							col<CourseRevenueItem>('gross', {
								header: '總營業額',
								format: 'currency',
								width: 14,
								formula: (r) => mul(r.cell('salesCount'), r.cell('price')),
							}),
						]}
						total={{ gross: 'sum' }}
					/>

					<Table
						name="summary"
						kind="keyValue"
						title="財務彙總計算"
						data={[
							{
								key: 'totalGross',
								label: '總營業額 (毛利)',
								value: sum(ref('courses').column('gross')),
								format: 'currency',
							},
							{
								key: 'platformFee',
								label: '平台服務費',
								value: round(
									mul(ref('summary').get('totalGross'), ref('assumptions').get('platformFeeRate')),
									0,
								),
								format: 'currency',
							},
							{
								key: 'taxAmount',
								label: '稅額',
								value: round(
									mul(ref('summary').get('totalGross'), ref('assumptions').get('taxRate')),
									0,
								),
								format: 'currency',
							},
							{
								key: 'netPayout',
								label: '實撥款金額',
								value: sub(
									ref('summary').get('totalGross'),
									sum(ref('summary').get('platformFee'), ref('summary').get('taxAmount')),
								),
								format: 'currency',
							},
						]}
					/>
				</Stack>
			</Sheet>
		</Workbook>
	)
}
