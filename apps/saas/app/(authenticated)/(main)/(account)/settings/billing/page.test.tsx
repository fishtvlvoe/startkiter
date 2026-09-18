import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.hoisted(() => vi.fn());
const userHasCourseAccessMock = vi.hoisted(() => vi.fn());
const listPurchasesMock = vi.hoisted(() => vi.fn());
const findManyMock = vi.hoisted(() => vi.fn());
const prefetchQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@auth/lib/server", () => ({
	getSession: getSessionMock,
}));

vi.mock("../../../../../../lib/course-access", () => ({
	userHasCourseAccess: userHasCourseAccessMock,
}));

vi.mock("@payments/lib/server", () => ({
	listPurchases: listPurchasesMock,
}));

vi.mock("@startkiter/database", () => ({
	db: {
		courseSubscription: {
			findMany: findManyMock,
		},
	},
}));

vi.mock("@startkiter/payments/lib/helper", () => ({
	createPurchasesHelper: () => ({ activePlan: null }),
}));

vi.mock("@shared/lib/server", () => ({
	getServerQueryClient: () => ({
		prefetchQuery: prefetchQueryMock,
	}),
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		payments: {
			listPurchases: {
				queryKey: () => ["payments", "listPurchases"],
			},
		},
	},
}));

vi.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => `[t:${key}]`,
}));

vi.mock("@shared/components/PageHeader", () => ({
	PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
		<header data-testid="page-header">
			{title}
			{subtitle}
		</header>
	),
}));

vi.mock("@shared/components/SettingsList", () => ({
	SettingsList: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="settings-list">{children}</div>
	),
}));

vi.mock("@payments/components/ActivePlan", () => ({
	ActivePlan: () => <div data-testid="active-plan" />,
}));

vi.mock("@payments/components/SubscriptionCancellationList", () => ({
	SubscriptionCancellationList: () => <div data-testid="subscription-cancellation-list" />,
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children?: React.ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import BillingSettingsPage from "./page";

describe("BillingSettingsPage purchase entry", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue({
			user: { id: "user-1", email: "buyer@example.com" },
		});
		listPurchasesMock.mockResolvedValue([]);
		findManyMock.mockResolvedValue([]);
		prefetchQueryMock.mockResolvedValue(undefined);
	});

	it("shows checkout entry for users without course access", async () => {
		userHasCourseAccessMock.mockResolvedValue(false);

		const jsx = await BillingSettingsPage();
		const html = renderToStaticMarkup(jsx);

		expect(html).toContain('data-testid="billing-checkout-entry"');
		expect(html).toContain('href="/checkout"');
		expect(html).not.toContain('data-testid="billing-owned-state"');
		expect(html).not.toContain('href="/course"');
	});

	it("shows owned state and course link for entitled users", async () => {
		userHasCourseAccessMock.mockResolvedValue(true);

		const jsx = await BillingSettingsPage();
		const html = renderToStaticMarkup(jsx);

		expect(html).toContain('data-testid="billing-owned-state"');
		expect(html).toContain('href="/course"');
		expect(html).not.toContain('data-testid="billing-checkout-entry"');
	});
});
