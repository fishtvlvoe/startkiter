import { call } from '@orpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@startkiter/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))

import { auth } from '@startkiter/auth'
import { exportCouponsSpreadsheet } from './export-coupons-spreadsheet'

describe('exportCouponsSpreadsheet', () => {
	beforeEach(() => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: 'admin-1', role: 'admin' },
			session: { id: 'session-1' },
		} as never)
	})

	it('returns a downloadable xlsx payload for coupons', async () => {
		const result = await call(exportCouponsSpreadsheet, {
			coupons: [{ couponId: 'c-1', code: 'SAVE100', discountType: 'amount', timesRedeemed: 5, totalDiscountAmount: 500, totalOrderAmount: 44000 }],
		}, { context: { headers: new Headers() } })

		expect(result.filename).toBe('coupons.xlsx')
		expect(result.contentType).toContain('spreadsheetml.sheet')
		expect(Buffer.from(result.data, 'base64').subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
	})
})
