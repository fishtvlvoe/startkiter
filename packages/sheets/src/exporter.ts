import {
	compile,
	evaluateWorkbook,
	toCsv,
	toHtml,
	type CompiledWorkbook,
	type CsvOptions,
	type HtmlOptions,
	type WorkbookNode,
} from '@open-sheet/core'
import { XlsxWriter, type WriteOptions } from '@open-sheet/core/node'

export type { WriteOptions, CsvOptions, HtmlOptions, CompiledWorkbook }

/**
 * 遞迴解開 React Element 或 open-sheet JSX 結構
 */
export function resolveWorkbookNode(node: unknown): WorkbookNode {
	if (typeof node !== 'object' || node === null) {
		throw new TypeError('Invalid workbook: expected an object or JSX element')
	}

	// 若已為 open-sheet compiled / AST node
	if ('kind' in node && (node as { kind?: string }).kind === 'workbook') {
		return node as WorkbookNode
	}

	// 若為 React Element (如 { type: Function, props: Object })
	if ('type' in node && typeof (node as { type?: unknown }).type === 'function') {
		const typeFn = (node as { type: (props: unknown) => unknown }).type
		const rawProps = (node as { props?: Record<string, unknown> }).props ?? {}
		const props: Record<string, unknown> = { ...rawProps }

		if ('children' in props) {
			if (Array.isArray(props.children)) {
				props.children = props.children.map(resolveWorkbookNode)
			} else if (props.children !== undefined) {
				props.children = resolveWorkbookNode(props.children)
			}
		}

		const resolved = typeFn(props)
		return resolveWorkbookNode(resolved)
	}

	return node as WorkbookNode
}

/**
 * 將 Workbook (JSX 結構或 CompiledWorkbook) 編譯並產出 .xlsx Buffer
 */
export async function toXlsxBuffer(
	workbook: unknown,
	options: WriteOptions = {},
): Promise<Buffer> {
	const compiled = isCompiledWorkbook(workbook)
		? workbook
		: compile(resolveWorkbookNode(workbook))
	const writer = new XlsxWriter()
	return await writer.write(compiled, options)
}

/**
 * 將 Workbook 編譯為各分頁的 CSV 字串對應表 { [sheetName]: csvContent }
 */
export function toCsvRecords(
	workbook: unknown,
	options: CsvOptions = {},
): Record<string, string> {
	const compiled = isCompiledWorkbook(workbook)
		? workbook
		: compile(resolveWorkbookNode(workbook))
	const values = evaluateWorkbook(compiled)
	const result: Record<string, string> = {}

	for (const sheet of compiled.sheets) {
		result[sheet.name] = toCsv(sheet, values, options)
	}

	return result
}

/**
 * 將 Workbook 編譯為自包含 (Self-contained) 的 HTML 報表
 */
export function toHtmlString(
	workbook: unknown,
	options: HtmlOptions = {},
): string {
	const compiled = isCompiledWorkbook(workbook)
		? workbook
		: compile(resolveWorkbookNode(workbook))
	return toHtml(compiled, options)
}

/**
 * 建立可用於 Next.js / Web API 的 Excel 下載 HTTP Response
 */
export function createXlsxDownloadResponse(
	buffer: Buffer,
	filename = 'export.xlsx',
): Response {
	const encodedFilename = encodeURIComponent(filename)
	return new Response(new Uint8Array(buffer), {
		status: 200,
		headers: {
			'Content-Type':
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
		},
	})
}

function isCompiledWorkbook(obj: unknown): obj is CompiledWorkbook {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'sheets' in obj &&
		'registry' in obj &&
		'definedNames' in obj
	)
}
