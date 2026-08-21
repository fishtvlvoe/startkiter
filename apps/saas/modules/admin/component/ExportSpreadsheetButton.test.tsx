import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ExportSpreadsheetButton } from './ExportSpreadsheetButton'

describe('ExportSpreadsheetButton', () => {
	it('renders a download link for the selected report', () => {
		const html = renderToStaticMarkup(<ExportSpreadsheetButton endpoint="/api/export/orders" />)
		expect(html).toContain('href="/api/export/orders"')
		expect(html).toContain('download')
		expect(html).toContain('匯出活公式 Excel')
	})
})
