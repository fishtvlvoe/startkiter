import { describe, expect, it } from "vitest";

import { buildAllowanceInput, buildIssueInput } from "./invoice-issue-input";

const base = {
	orderNo: "ORDER-20260824-0001",
	amount: 1050,
	itemName: "StartKiter 開站包",
	buyerName: "買家",
	buyerEmail: "buyer@example.com",
};

describe("buildIssueInput", () => {
	it("defaults a personal invoice to the member carrier", () => {
		const result = buildIssueInput({
			...base,
			preference: {
				invoiceType: "PERSONAL",
				carrierType: null,
				carrierId: null,
				taxId: null,
				title: null,
				address: null,
				loveCode: null,
			},
		});

		expect(result.carrier?.type).toBe("MEMBER");
	});

	it("uses untaxed item price for ezPay B2B and keeps ECPay item price tax-inclusive", () => {
		const preference = {
			invoiceType: "COMPANY" as const,
			carrierType: null,
			carrierId: null,
			taxId: "12345678",
			title: "公司抬頭",
			address: "台北市",
			loveCode: null,
		};

		const ezpay = buildIssueInput({ ...base, preference, provider: "ezpay" });
		const ecpay = buildIssueInput({ ...base, preference, provider: "ecpay" });

		expect(ezpay.items[0]?.amount).toBeLessThan(base.amount);
		expect(ecpay.items[0]?.amount).toBe(base.amount);
	});

	it("maps donation invoices to the love code", () => {
		const result = buildIssueInput({
			...base,
			preference: {
				invoiceType: "DONATION",
				carrierType: null,
				carrierId: null,
				taxId: null,
				title: null,
				address: null,
				loveCode: "919",
			},
		});

		expect(result.donation?.npoban).toBe("919");
	});

	it("truncates item names to the provider limit", () => {
		const longName = "x".repeat(501);
		const result = buildIssueInput({
			...base,
			itemName: longName,
			provider: "ecpay",
			preference: {
				invoiceType: "PERSONAL",
				carrierType: null,
				carrierId: null,
				taxId: null,
				title: null,
				address: null,
				loveCode: null,
			},
		});

		expect(result.items[0]?.description).toHaveLength(500);
	});

	it("normalizes ezPay allowance references to its 20-character safe format", () => {
		const result = buildAllowanceInput({
			provider: "ezpay",
			invoiceNumber: "CD12345678",
			allowanceId: "ALLOW-cmta6nhuc000pmbz7dhj88nx7-1050",
			originalOrderId: "ORDER-1",
			amount: 1050,
			itemName: "開站包",
		});

		expect(result.allowanceId).toMatch(/^[A-Za-z0-9_]{1,20}$/);
		expect(result.providerOptions).toMatchObject({ merchantOrderNo: result.allowanceId });
	});
});
