import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@auth/hooks/use-session", () => ({
	useSession: vi.fn(),
}));

vi.mock("@admin/component/ExportSpreadsheetButton", () => ({
	ExportSpreadsheetButton: ({ endpoint }: { endpoint: string }) => (
		<button data-testid="export-button" data-endpoint={endpoint}>
			匯出試算表
		</button>
	),
}));

import { useSession } from "@auth/hooks/use-session";
import AdminBundlesPage from "./page";

const mockedUseSession = vi.mocked(useSession);

describe("AdminBundlesPage export permissions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ bundles: [], courses: [] }),
		}) as any;
	});

	it("ADMIN_EMAIL fallback operator 但無 admin.access 時，不顯示組合包匯出按鈕 (Requirement: Export button requires admin.access)", () => {
		mockedUseSession.mockReturnValue({
			user: { id: "op-1", email: "admin@example.com", role: "user" },
			session: { id: "s1" },
		} as any);

		const html = renderToStaticMarkup(<AdminBundlesPage />);

		expect(html).not.toContain("/api/export/bundles");
	});

	it("具備 admin 角色時，顯示組合包匯出按鈕", () => {
		mockedUseSession.mockReturnValue({
			user: { id: "admin-1", email: "admin@example.com", role: "admin" },
			session: { id: "s2" },
		} as any);

		const html = renderToStaticMarkup(<AdminBundlesPage />);

		expect(html).toContain("/api/export/bundles");
	});
});
