import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));

import { getSession } from "@auth/lib/server";

import AdminPagesLayout from "./layout";

const OPERATOR_EMAIL = "operator@example.com";
const originalAdminEmail = process.env.ADMIN_EMAIL;
const mockedGetSession = vi.mocked(getSession);

describe("pages-cms admin layout uses the shared operator guard (H-1 reverse matrix)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ADMIN_EMAIL = OPERATOR_EMAIL;
	});

	afterEach(() => {
		process.env.ADMIN_EMAIL = originalAdminEmail;
	});

	it("redirects a role=admin user whose email is not ADMIN_EMAIL", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "admin_1", email: "role-admin@example.com", role: "admin" },
		} as never);

		await expect(AdminPagesLayout({ children: "ok" })).rejects.toThrow("REDIRECT:/");
	});

	it("renders for ADMIN_EMAIL even when role is not admin", async () => {
		mockedGetSession.mockResolvedValue({
			user: { id: "op_1", email: OPERATOR_EMAIL, role: "user" },
		} as never);

		await expect(AdminPagesLayout({ children: "ok" })).resolves.toBe("ok");
	});
});
