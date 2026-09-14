import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/ui/components/toast", () => ({
	toastError: vi.fn(),
}));

import { toastError } from "@startkiter/ui/components/toast";

import { notifyCheckoutError } from "./PricingTable";

describe("PricingTable checkout errors", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows a user-visible error when checkout link creation fails", () => {
		const error = new Error("NOT_FOUND");

		notifyCheckoutError("建立結帳連結失敗，請稍後再試。", error);

		expect(toastError).toHaveBeenCalledWith("建立結帳連結失敗，請稍後再試。");
	});
});
