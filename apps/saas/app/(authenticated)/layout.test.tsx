import { beforeEach, describe, expect, it, vi } from "vitest";

const callTimestamps: Record<string, number> = {};

vi.mock("@auth/lib/server", () => ({
	getSession: vi.fn(),
	getOrganizationList: vi.fn(),
}));

vi.mock("@startkiter/database", () => ({
	getOrganizationMembership: vi.fn(),
}));

vi.mock("@payments/lib/server", () => ({
	listPurchases: vi.fn(),
}));

vi.mock("@startkiter/platform", () => ({
	findBuyerDeploymentsForUser: vi.fn(),
}));

const mockPrefetchQuery = vi.fn();
vi.mock("@shared/lib/server", () => ({
	getServerQueryClient: () => ({
		prefetchQuery: mockPrefetchQuery,
	}),
}));

vi.mock("@startkiter/auth/config", () => ({
	config: {
		organizations: {
			enable: true,
		},
	},
}));

vi.mock("@startkiter/payments/config", () => ({
	config: {
		billingAttachedTo: "user",
	},
}));

vi.mock("@shared/lib/permix", () => ({
	setupPermissions: vi.fn(),
	permix: {
		dehydrate: vi.fn(() => ({})),
	},
}));

vi.mock("@startkiter/api/modules/pages-cms/access", () => ({
	canAccessPagesCmsAdmin: vi.fn(() => false),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));

vi.mock("next/headers", () => ({
	headers: vi.fn(async () => ({
		get: (name: string) => (name === "x-pathname" ? "/bundles/combo-a" : null),
	})),
}));

vi.mock("@tanstack/react-query", () => ({
	HydrationBoundary: ({ children }: { children: React.ReactNode }) => children,
	dehydrate: vi.fn(() => ({})),
}));

vi.mock("@auth/components/SessionProvider", () => ({
	SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@organizations/components/ActiveOrganizationProvider", () => ({
	ActiveOrganizationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@shared/components/ConfirmationAlertProvider", () => ({
	ConfirmationAlertProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@shared/components/PermixProvider", () => ({
	PermixProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@shared/components/PagesCmsAccessProvider", () => ({
	PagesCmsAccessProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@deployment/components/SupportWidget", () => ({
	SupportWidget: () => null,
}));

vi.mock("./ChatwootScript", () => ({
	ChatwootScript: () => null,
}));

import { getOrganizationList, getSession } from "@auth/lib/server";
import { getOrganizationMembership } from "@startkiter/database";
import { listPurchases } from "@payments/lib/server";
import { findBuyerDeploymentsForUser } from "@startkiter/platform";
import { setupPermissions } from "@shared/lib/permix";
import { headers } from "next/headers";
import AuthenticatedLayout from "./layout";

const mockSession = {
	user: { id: "user-123", name: "Test User", email: "test@example.com" },
	session: { id: "session-123", activeOrganizationId: "org-123" },
};

describe("AuthenticatedLayout (5.1, 5.2, 5.3)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		for (const key of Object.keys(callTimestamps)) {
			delete callTimestamps[key];
		}
		vi.mocked(getSession).mockResolvedValue(mockSession as never);
		vi.mocked(getOrganizationMembership).mockResolvedValue({ role: "member" } as never);
		vi.mocked(getOrganizationList).mockResolvedValue([{ id: "org-1", name: "Org 1" }] as never);
		vi.mocked(listPurchases).mockResolvedValue([{ id: "pur-1" }] as never);
		vi.mocked(findBuyerDeploymentsForUser).mockResolvedValue([] as never);
		vi.mocked(headers).mockResolvedValue({
			get: (name: string) => (name === "x-pathname" ? "/bundles/combo-a" : null),
		} as never);
		mockPrefetchQuery.mockImplementation(async (options: { queryFn?: () => unknown }) => {
			if (options.queryFn) {
				return await options.queryFn();
			}
		});
	});

	it("unauthenticated visitor redirects to /login with next from x-pathname", async () => {
		vi.mocked(getSession).mockResolvedValue(null as never);

		await expect(AuthenticatedLayout({ children: "child content" })).rejects.toThrow(
			"REDIRECT:/login?next=%2Fbundles%2Fcombo-a",
		);
	});

	it("5.1: 驗證 getOrganizationMembership、getOrganizationList預取、listPurchases預取、findBuyerDeploymentsForUser 為平行發出而非序列 await，且 prefetchQuery 實際呼叫 queryFn", async () => {
		const delayMs = 40;
		const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

		vi.mocked(getOrganizationMembership).mockImplementation(async () => {
			callTimestamps.membership = Date.now();
			await delay(delayMs);
			return { role: "admin" } as never;
		});

		vi.mocked(getOrganizationList).mockImplementation(async () => {
			callTimestamps.orgList = Date.now();
			await delay(delayMs);
			return [{ id: "org-1", name: "Org 1" }] as never;
		});

		vi.mocked(listPurchases).mockImplementation(async () => {
			callTimestamps.purchases = Date.now();
			await delay(delayMs);
			return [{ id: "pur-1" }] as never;
		});

		mockPrefetchQuery.mockImplementation(async (options: { queryKey: unknown; queryFn?: () => unknown }) => {
			const keyStr = JSON.stringify(options.queryKey);
			if (keyStr.includes("organizations") && options.queryFn) {
				return await options.queryFn();
			}
			if (keyStr.includes("listPurchases") && options.queryFn) {
				return await options.queryFn();
			}
			if (options.queryFn) {
				return await options.queryFn();
			}
		});

		vi.mocked(findBuyerDeploymentsForUser).mockImplementation(async () => {
			callTimestamps.deployments = Date.now();
			await delay(delayMs);
			return [] as never;
		});

		await AuthenticatedLayout({ children: "child content" });

		expect(callTimestamps.membership).toBeDefined();
		expect(callTimestamps.orgList).toBeDefined();
		expect(callTimestamps.purchases).toBeDefined();
		expect(callTimestamps.deployments).toBeDefined();

		// 驗證 prefetchQuery 確實呼叫了 queryFn，且回傳預期的結果
		expect(getOrganizationList).toHaveBeenCalled();
		expect(listPurchases).toHaveBeenCalled();

		const timestamps = [
			callTimestamps.membership,
			callTimestamps.orgList,
			callTimestamps.purchases,
			callTimestamps.deployments,
		];
		const spread = Math.max(...timestamps) - Math.min(...timestamps);

		// 若為序列 await，每個延遲 40ms，4 個依序執行跨度至少 120ms。
		// 若為 Promise.all 平行發出，4 個呼叫時間差在同一個 tick（< 25ms）。
		expect(spread).toBeLessThan(25);
	});

	it("5.2: setupPermissions、deployments 陣列組成與條件式查詢內容與修改前完全一致", async () => {
		vi.mocked(getOrganizationMembership).mockResolvedValue({
			id: "mem-1",
			organizationId: "org-123",
			userId: "user-123",
			role: "owner",
			createdAt: new Date(),
		} as never);
		vi.mocked(findBuyerDeploymentsForUser).mockResolvedValue([
			{
				id: "dep-1",
				userId: "user-123",
				publicUrl: "https://site.example.com",
				tier: "pro",
				extraFieldIgnored: "ignored",
			} as never,
		]);

		const result = await AuthenticatedLayout({ children: "child content" });

		expect(setupPermissions).toHaveBeenCalledWith({
			user: mockSession.user,
			membershipRole: "owner",
		});
		expect(findBuyerDeploymentsForUser).toHaveBeenCalledWith("user-123");
		expect(result).toBeDefined();
	});

	it("5.2 (順序保證): setupPermissions 必須在 Promise.all 全部 resolve 之後才被呼叫", async () => {
		let membershipResolved = false;
		let deploymentsResolved = false;
		let permissionsCalledAfterResolves = false;

		const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

		vi.mocked(getOrganizationMembership).mockImplementation(async () => {
			await delay(30);
			membershipResolved = true;
			return { role: "admin" } as never;
		});

		vi.mocked(findBuyerDeploymentsForUser).mockImplementation(async () => {
			await delay(30);
			deploymentsResolved = true;
			return [] as never;
		});

		vi.mocked(setupPermissions).mockImplementation(() => {
			if (membershipResolved && deploymentsResolved) {
				permissionsCalledAfterResolves = true;
			}
		});

		await AuthenticatedLayout({ children: "child content" });

		expect(permissionsCalledAfterResolves).toBe(true);
	});

	describe("5.3: 四個查詢各自 reject 時（fail-fast），layout render 整體拋出例外", () => {
		it.each([
			{
				name: "getOrganizationMembership",
				setup: () => {
					vi.mocked(getOrganizationMembership).mockRejectedValue(new Error("Membership DB error"));
				},
				expectedError: "Membership DB error",
			},
			{
				name: "getOrganizationList (prefetchQuery queryFn)",
				setup: () => {
					vi.mocked(getOrganizationList).mockRejectedValue(new Error("OrgList fetch error"));
				},
				expectedError: "OrgList fetch error",
			},
			{
				name: "listPurchases (prefetchQuery queryFn)",
				setup: () => {
					vi.mocked(listPurchases).mockRejectedValue(new Error("Purchases fetch error"));
				},
				expectedError: "Purchases fetch error",
			},
			{
				name: "findBuyerDeploymentsForUser",
				setup: () => {
					vi.mocked(findBuyerDeploymentsForUser).mockRejectedValue(new Error("Deployments DB error"));
				},
				expectedError: "Deployments DB error",
			},
		])("$name 失敗時整體 fail-fast 拋出例外", async ({ setup, expectedError }) => {
			setup();
			await expect(AuthenticatedLayout({ children: "child content" })).rejects.toThrow(expectedError);
		});
	});
});
