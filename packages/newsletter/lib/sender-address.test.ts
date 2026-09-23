import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({
	findUnique: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	db: {
		siteSetting: { findUnique, upsert: vi.fn() },
	},
}));

describe("sender physical address gate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetModules();
	});

	it("blocks promotional campaign activation when sender address is empty", async () => {
		findUnique.mockResolvedValue(null);
		const { getSenderPhysicalAddress, assertSenderAddressConfigured } = await import(
			"./sender-address"
		);

		const address = await getSenderPhysicalAddress();
		expect(assertSenderAddressConfigured(address)).toEqual({
			ok: false,
			reason: "sender_physical_address_required",
		});
	});

	it("allows activation when a physical address is configured", async () => {
		findUnique.mockResolvedValue({
			id: "newsletter.senderPhysicalAddress",
			ciphertext: JSON.stringify({ physicalAddress: "台北市信義區信義路五段7號" }),
		});
		const { getSenderPhysicalAddress, assertSenderAddressConfigured } = await import(
			"./sender-address"
		);

		const address = await getSenderPhysicalAddress();
		expect(assertSenderAddressConfigured(address)).toEqual({ ok: true });
		expect(address).toContain("台北市");
	});
});
