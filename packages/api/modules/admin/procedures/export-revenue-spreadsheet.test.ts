import { call } from '@orpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@startkiter/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))

import { auth } from '@startkiter/auth'
import { exportRevenueSpreadsheet } from './export-revenue-spreadsheet'

describe('exportRevenueSpreadsheet', () => {
	beforeEach(() => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: 'admin-1', role: 'admin' },
			session: { id: 'session-1' },
		} as never)
	})

	it('returns a downloadable xlsx payload for admin users', async () => {
		const result = await call(exportRevenueSpreadsheet, {
			courses: [{ courseId: 'sku-a', title: '開站包', salesCount: 2, price: 8800 }],
		}, { context: { headers: new Headers() } })

		expect(result.filename).toBe('revenue.xlsx')
		expect(Buffer.from(result.data, 'base64').subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
	})
})
