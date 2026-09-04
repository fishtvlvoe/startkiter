import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		course: {
			voidInvoice: vi.fn(),
			issueInvoiceAllowance: vi.fn(),
			resolveInvoiceReview: vi.fn(),
		},
	},
}));

import { InvoiceOperationsButtons } from "./InvoiceOperationsButtons";

function renderWithClient(node: React.ReactElement): string {
	const client = new QueryClient();
	return renderToStaticMarkup(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const baseInvoice = {
	id: "invoice-1",
	status: "ALLOWANCE",
	amount: 8800,
	allowanceTotal: 0,
	invoiceDate: new Date("2026-08-24T00:00:00.000Z"),
	canVoid: false,
};

describe("InvoiceOperationsButtons", () => {
	it("renders resolution actions instead of plain text when attentionReason is ALLOWANCE_NEEDS_REVIEW", () => {
		const html = renderWithClient(
			<InvoiceOperationsButtons invoice={{ ...baseInvoice, attentionReason: "ALLOWANCE_NEEDS_REVIEW" }} />,
		);

		expect(html).toContain("確認已完成");
		expect(html).toContain("確認未完成");
		expect(html).not.toMatch(/^發票作業待確認：ALLOWANCE_NEEDS_REVIEW$/);
	});

	it("renders resolution actions instead of plain text when attentionReason is VOID_NEEDS_REVIEW", () => {
		const html = renderWithClient(
			<InvoiceOperationsButtons invoice={{ ...baseInvoice, status: "ISSUED", attentionReason: "VOID_NEEDS_REVIEW" }} />,
		);

		expect(html).toContain("確認已完成");
		expect(html).toContain("確認未完成");
	});

	it("still shows plain text with no actions for other attentionReason values", () => {
		const html = renderWithClient(
			<InvoiceOperationsButtons invoice={{ ...baseInvoice, attentionReason: "SOME_OTHER_REASON" }} />,
		);

		expect(html).toContain("發票作業待確認：SOME_OTHER_REASON");
		expect(html).not.toContain("確認已完成");
	});
});
