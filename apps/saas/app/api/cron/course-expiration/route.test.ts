import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/api/modules/course/lib/expiration-reminder-scan", () => ({
	scanAndSendExpirationReminders: vi.fn(),
}));

import { scanAndSendExpirationReminders } from "@startkiter/api/modules/course/lib/expiration-reminder-scan";

import { GET } from "./route";

describe("GET /api/cron/course-expiration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("CRON_SECRET", "cron-secret");
		vi.mocked(scanAndSendExpirationReminders).mockResolvedValue({ sent: 1, skipped: 0, failed: 0 });
	});

	it.each([undefined, "Bearer wrong", "Basic cron-secret"])("rejects an invalid authorization header: %s", async (authorization) => {
		const response = await GET(new Request("http://localhost/api/cron/course-expiration", {
			headers: authorization ? { authorization } : undefined,
		}));

		expect(response.status).toBe(401);
		expect(scanAndSendExpirationReminders).not.toHaveBeenCalled();
	});

	it("runs the scan with a valid bearer token", async () => {
		const response = await GET(new Request("http://localhost/api/cron/course-expiration", {
			headers: { authorization: "Bearer cron-secret" },
		}));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ sent: 1, skipped: 0, failed: 0 });
		expect(scanAndSendExpirationReminders).toHaveBeenCalledOnce();
	});
});
