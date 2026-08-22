import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: { order: { findMany: vi.fn() } },
}));

import { db } from "@startkiter/database";

import { createGenerateSpreadsheetTool } from "./generate-spreadsheet";

const adminUser = { role: "admin" };
const memberUser = { role: "user" };

function callTool(user: unknown, input: { report: "orders" | "revenue"; format?: "xlsx" | "html" }) {
	const generateSpreadsheet = createGenerateSpreadsheetTool(user as never);
	// AI SDK tool execute() has (input, options) signature; options are unused here.
	return (generateSpreadsheet.execute as (input: unknown, options: unknown) => Promise<unknown>)(
		{ format: "xlsx", ...input },
		{},
	);
}

describe("createGenerateSpreadsheetTool", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("refuses to generate a report for a non-admin user", async () => {
		const result = await callTool(memberUser, { report: "orders" });
		expect(result).toMatchObject({ error: expect.stringContaining("管理員") });
		expect(db.order.findMany).not.toHaveBeenCalled();
	});

	it("generates an orders xlsx from real order rows for an admin user", async () => {
		vi.mocked(db.order.findMany).mockResolvedValue([
			{
				orderNo: "ORD-001",
				sku: "startkiter-kit",
				amount: 8800,
				status: "paid",
				createdAt: new Date(),
				user: { name: "王小明", email: "x@example.com" },
			},
		] as never);

		const result = (await callTool(adminUser, { report: "orders", format: "xlsx" })) as {
			format: string;
			filename: string;
			data: string;
		};

		expect(result.format).toBe("xlsx");
		expect(result.filename).toBe("orders.xlsx");
		expect(result.data.length).toBeGreaterThan(0);
		// OOXML .xlsx files are zip archives; the base64 payload should decode to a PK zip header.
		expect(Buffer.from(result.data, "base64").subarray(0, 2).toString()).toBe("PK");
	});

	it("generates a revenue html preview grouped by sku for an admin user", async () => {
		vi.mocked(db.order.findMany).mockResolvedValue([
			{ sku: "startkiter-kit", amount: 8800, status: "paid", createdAt: new Date() },
			{ sku: "startkiter-kit", amount: 8800, status: "paid", createdAt: new Date() },
		] as never);

		const result = (await callTool(adminUser, { report: "revenue", format: "html" })) as {
			format: string;
			html: string;
		};

		expect(result.format).toBe("html");
		expect(result.html).toContain("startkiter-kit");
		expect(db.order.findMany).toHaveBeenCalledWith(
			expect.objectContaining({ where: { status: "paid" } }),
		);
	});
});
