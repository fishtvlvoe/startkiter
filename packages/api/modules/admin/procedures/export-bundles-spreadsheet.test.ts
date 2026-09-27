import { call } from '@orpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@startkiter/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))

import { auth } from '@startkiter/auth'
import { exportBundlesSpreadsheet } from './export-bundles-spreadsheet'

describe('exportBundlesSpreadsheet', () => {
	beforeEach(() => {
		vi.mocked(auth.api.getSession).mockResolvedValue({
			user: { id: 'admin-1', role: 'admin' },
			session: { id: 'session-1' },
		} as never)
	})

	it('returns a downloadable xlsx payload for bundles', async () => {
		const result = await call(exportBundlesSpreadsheet, {
			bundles: [{ bundleId: 'b-1', title: '全端特惠組', purchaseCount: 10, claimCount: 8, price: 12000 }],
		}, { context: { headers: new Headers() } })

		expect(result.filename).toBe('bundles.xlsx')
		expect(result.contentType).toContain('spreadsheetml.sheet')
		expect(Buffer.from(result.data, 'base64').subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
	})
})
