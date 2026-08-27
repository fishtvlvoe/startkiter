import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/api/modules/course/lib/invoice-events", () => ({
	retryPendingInvoices: vi.fn(),
}));

import { retryPendingInvoices } from "@startkiter/api/modules/course/lib/invoice-events";
import { POST } from "./route";

describe("POST /api/cron/invoice-retry", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("CRON_SECRET", "cron-secret");
		vi.mocked(retryPendingInvoices).mockResolvedValue({ scanned: 2, issued: 1, failed: 1 });
	});

	it.each([undefined, "Bearer wrong", "Basic cron-secret"]) ("rejects an invalid authorization header: %s", async (authorization) => {
		const response = await POST(new Request("http://localhost/api/cron/invoice-retry", {
			headers: authorization ? { authorization } : undefined,
		}));

		expect(response.status).toBe(401);
		expect(retryPendingInvoices).not.toHaveBeenCalled();
	});

	it("retries pending invoices with a valid bearer token", async () => {
		const response = await POST(new Request("http://localhost/api/cron/invoice-retry", {
			headers: { authorization: "Bearer cron-secret" },
		}));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, scanned: 2, issued: 1, failed: 1 });
		expect(retryPendingInvoices).toHaveBeenCalledOnce();
	});
});
