import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@startkiter/database", () => ({
	db: {
		loginAttempt: {
			create: vi.fn(),
		},
	},
}));

vi.mock("@startkiter/logs", () => ({
	logger: {
		error: vi.fn(),
	},
}));

import { db } from "@startkiter/database";

import { recordLoginAttempt } from "./login-attempt";

describe("recordLoginAttempt", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(db.loginAttempt.create).mockResolvedValue({ id: "attempt-1" } as never);
	});

	it("records a successful sign-in with request metadata", async () => {
		await recordLoginAttempt("buyer@example.com", "203.0.113.10", true, "Browser/1.0");

		expect(db.loginAttempt.create).toHaveBeenCalledWith({
			data: {
				email: "buyer@example.com",
				ipAddress: "203.0.113.10",
				success: true,
				userAgent: "Browser/1.0",
			},
		});
	});

	it("records a failed sign-in without blocking the caller when persistence fails", async () => {
		vi.mocked(db.loginAttempt.create).mockRejectedValue(new Error("database unavailable"));

		recordLoginAttempt("buyer@example.com", "203.0.113.10", false);
		await Promise.resolve();
		expect(db.loginAttempt.create).toHaveBeenCalledWith({
			data: {
				email: "buyer@example.com",
				ipAddress: "203.0.113.10",
				success: false,
				userAgent: undefined,
			},
		});
	});
});
