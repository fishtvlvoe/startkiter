import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@startkiter/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@startkiter/database', () => ({ db: { order: { findMany: vi.fn() } } }))
vi.mock('@startkiter/api/modules/admin/procedures/export-revenue-spreadsheet', () => ({
	exportRevenueSpreadsheet: { callable: vi.fn() },
}))

import { auth } from '@startkiter/auth'
import { db } from '@startkiter/database'
import { exportRevenueSpreadsheet } from '@startkiter/api/modules/admin/procedures/export-revenue-spreadsheet'
import { GET } from './route'

describe('GET /api/export/revenue', () => {
	beforeEach(() => vi.clearAllMocks())

	it('rejects non-admin requests', async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: 'user-1', role: 'user' } } as never)
		const response = await GET(new Request('http://localhost/api/export/revenue'))
		expect(response.status).toBe(403)
	})

	it('returns the procedure xlsx payload as a download', async () => {
		vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } } as never)
		vi.mocked(db.order.findMany).mockResolvedValue([
			{ sku: 'sku-a', amount: 8800, status: 'paid' },
			{ sku: 'sku-a', amount: 8800, status: 'paid' },
		] as never)
		vi.mocked(exportRevenueSpreadsheet.callable).mockReturnValue(vi.fn().mockResolvedValue({
			filename: 'revenue.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', data: Buffer.from('xlsx').toString('base64'),
		}) as never)

		const response = await GET(new Request('http://localhost/api/export/revenue'))
		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Disposition')).toContain('revenue.xlsx')
		expect(await response.text()).toBe('xlsx')
	})
})
