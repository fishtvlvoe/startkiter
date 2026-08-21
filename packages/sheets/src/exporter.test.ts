import { describe, expect, it } from 'vitest'
import {
	createXlsxDownloadResponse,
	toCsvRecords,
	toHtmlString,
	toXlsxBuffer,
} from './exporter.js'
import { OrdersSpreadsheet } from './templates/orders.js'
import { RevenueSpreadsheet } from './templates/revenue.js'

describe('@startkiter/sheets exporter', () => {
	const mockOrders = [
		{
			id: 'ORD-001',
			customerName: '王小明',
			itemName: 'SaaS 年費方案',
			qty: 1,
			unitPrice: 12000,
		},
		{
			id: 'ORD-002',
			customerName: '李小華',
			itemName: 'AI 加值額度包',
			qty: 3,
			unitPrice: 1500,
		},
	]

	it('應成功將 OrdersSpreadsheet 匯出為 xlsx Buffer 並具有正確的 Excel 檔頭特徵', async () => {
		const workbookJsx = OrdersSpreadsheet({ orders: mockOrders })
		const buffer = await toXlsxBuffer(workbookJsx)

		expect(buffer).toBeInstanceOf(Buffer)
		expect(buffer.length).toBeGreaterThan(1000)

		// 驗證 ZIP / OOXML magic bytes (PK\x03\x04)
		expect(buffer[0]).toBe(0x50)
		expect(buffer[1]).toBe(0x4b)
		expect(buffer[2]).toBe(0x03)
		expect(buffer[3]).toBe(0x04)
	})

	it('應成功產出 CSV 並包含計算後數值與標題', () => {
		const workbookJsx = OrdersSpreadsheet({ orders: mockOrders })
		const csvRecords = toCsvRecords(workbookJsx)

		expect(csvRecords).toHaveProperty('訂單明細')
		const csv = csvRecords['訂單明細']
		expect(csv).toContain('訂單編號')
		expect(csv).toContain('金額小計')
		expect(csv).toContain('ORD-001')
		expect(csv).toContain('ORD-002')
	})

	it('應成功將 RevenueSpreadsheet 匯出為 HTML 格式', () => {
		const mockCourses = [
			{ courseId: 'C-01', title: '全端開發實戰', salesCount: 20, price: 3000 },
			{ courseId: 'C-02', title: 'AI 應用實務', salesCount: 15, price: 4500 },
		]
		const workbookJsx = RevenueSpreadsheet({
			courses: mockCourses,
			platformFeeRate: 0.15,
			taxRate: 0.05,
		})

		const html = toHtmlString(workbookJsx)
		expect(html.toLowerCase()).toContain('<!doctype html>')
		expect(html).toContain('營收結算')
		expect(html).toContain('參數設定')
	})

	it('應正確建立帶有 Content-Disposition 檔名的 HTTP Response', () => {
		const dummyBuffer = Buffer.from('mock-excel-data')
		const response = createXlsxDownloadResponse(dummyBuffer, 'july-report.xlsx')

		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Type')).toBe(
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		)
		expect(response.headers.get('Content-Disposition')).toContain(
			'attachment; filename="july-report.xlsx"',
		)
	})
})
