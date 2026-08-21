import { call } from '@orpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@startkiter/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))

import { auth } from '@startkiter/auth'
import { exportOrdersSpreadsheet } from './export-orders-spreadsheet'

describe('exportOrdersSpreadsheet', () => {
	beforeEach(() => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: 'admin-1', role: 'admin' },
			session: { id: 'session-1' },
		} as never)
	})

	it('returns a downloadable xlsx payload for admin users', async () => {
		const result = await call(exportOrdersSpreadsheet, {
			orders: [{ orderNo: 'ORD-001', customerName: '王小明', sku: 'startkiter-mvp', amount: 8800, status: 'paid' }],
		}, { context: { headers: new Headers() } })

		expect(result.filename).toBe('orders.xlsx')
		expect(result.contentType).toContain('spreadsheetml.sheet')
		expect(Buffer.from(result.data, 'base64').subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
	})
})
