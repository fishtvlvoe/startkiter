import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@startkiter/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@startkiter/database', () => ({ db: { order: { findMany: vi.fn() } } }))
vi.mock('@startkiter/api/modules/admin/procedures/export-orders-spreadsheet', () => ({
	exportOrdersSpreadsheet: { callable: vi.fn() },
}))

import { auth } from '@startkiter/auth'
import { db } from '@startkiter/database'
import { exportOrdersSpreadsheet } from '@startkiter/api/modules/admin/procedures/export-orders-spreadsheet'
import { GET } from './route'

describe('GET /api/export/orders', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('rejects unauthenticated requests', async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue(null)
		const response = await GET(new Request('http://localhost/api/export/orders'))
		expect(response.status).toBe(401)
	})

	it('returns the procedure xlsx payload as a download', async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as never)
		vi.mocked(db.order.findMany).mockResolvedValue([
			{ orderNo: 'ORD-001', user: { name: '王小明', email: 'x@example.com' }, sku: 'sku-a', amount: 8800, status: 'paid' },
		] as never)
		vi.mocked(exportOrdersSpreadsheet.callable).mockReturnValue(vi.fn().mockResolvedValue({
			filename: 'orders.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', data: Buffer.from('xlsx').toString('base64'),
		}) as never)

		const response = await GET(new Request('http://localhost/api/export/orders'))
		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Disposition')).toContain('orders.xlsx')
		expect(await response.text()).toBe('xlsx')
	})
})
