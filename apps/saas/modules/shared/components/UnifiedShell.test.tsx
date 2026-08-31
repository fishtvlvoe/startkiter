import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import UserLayout from "../../../app/(authenticated)/(main)/(account)/layout";
import AgentPage from "../../../app/agent/page";
import AdminSettingsPage from "../../../app/(authenticated)/(main)/(account)/admin/settings/page";
import CoursePage from "../../../app/(authenticated)/(main)/(account)/course/page";
import AppPage from "../../../app/(authenticated)/(main)/(account)/app/page";
import { AppWrapper } from "./AppWrapper";

let mockPathname = "/";
let mockCanAccessAdmin = false;
let mockIsMobile = false;

vi.mock("next/navigation", () => ({
	usePathname: () => mockPathname,
	useRouter: () => ({ refresh: () => {}, push: () => {}, replace: () => {} }),
	redirect: (url: string) => {
		throw new Error(`REDIRECT:${url}`);
	},
}));

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) => key,
	useLocale: () => "zh-tw",
}));

vi.mock("next-intl/server", () => ({
	getTranslations: async () => (key: string) => key,
}));

vi.mock("@auth/hooks/use-session", () => ({
	useSession: () => ({
		user: { id: "u1", name: "Test User", email: "learner@example.com", image: null },
	}),
}));

	vi.mock("@auth/lib/server", () => ({
	getSession: async () => ({
		user: { id: "u1", name: "Test User", email: "learner@example.com", role: "admin" },
		session: { id: "s1", activeOrganizationId: null },
	}),
	getOrganizationList: async () => [],
}));

vi.mock("@organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("@shared/components/PermixProvider", () => ({
	usePermissions: () => ({
		check: (perm: string) => (perm === "admin.access" ? mockCanAccessAdmin : false),
	}),
}));

vi.mock("../lib/sidebar-layout", () => ({
	useSidebarLayout: () => ({ groups: [], items: [], isLoading: false }),
	useSaveSidebarLayout: () => ({ mutate: () => {}, isPending: false }),
}));

vi.mock("../hooks/use-media-query", () => ({
	useIsMobile: () => mockIsMobile,
}));

vi.mock("@startkiter/auth/config", () => ({
	config: {
		organizations: { enable: false, hideOrganization: true, requireOrganization: false },
		users: {},
	},
}));

vi.mock("@startkiter/payments/config", () => ({
	config: {
		billingAttachedTo: "user",
		requireActiveSubscription: false,
	},
}));

vi.mock("@startkiter/database", () => ({
	db: {
		order: {
			findMany: async () => [],
		},
	},
	getCourseAccessOrdersForUser: async () => [],
}));

vi.mock("@i18n/lib/update-locale", () => ({
	updateLocale: async () => {},
}));

vi.mock("@startkiter/i18n", () => ({
	config: {
		locales: {
			"zh-tw": { label: "繁體中文" },
			"zh-cn": { label: "简体中文" },
			en: { label: "English" },
		},
	},
}));

vi.mock("@shared/components/NotificationCenter", () => ({
	NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}));

vi.mock("@ai/components/AiChat", () => ({
	AiChat: () => <div data-testid="ai-chat">AI Chat Component</div>,
}));

vi.mock("../../../app/agent/agent-chat-client", () => ({
	AgentChatClient: () => <div data-testid="agent-chat">Site Agent Chat</div>,
}));

describe("Unified Shell covering authenticated routes (Task 5.1 / Task 5.2 / Task 50.1)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPathname = "/";
		mockCanAccessAdmin = false;
		mockIsMobile = false;
	});

	it("Task 5.1: renders the /agent route inside the unified Shell sidebar structure", async () => {
		mockPathname = "/agent";
		mockCanAccessAdmin = false;

		const agentContent = await AgentPage();
		const html = renderToStaticMarkup(
			<UserLayout>{agentContent}</UserLayout>,
		);

		// Must contain unified Shell sidebar structure
		expect(html).toContain("sidebar-user-area");
		expect(html).toContain("locale-switch");
		expect(html).toContain("站內助手");
	});

	it("Task 5.2: renders the /admin/settings route inside the unified Shell sidebar structure", async () => {
		mockPathname = "/admin/settings";
		mockCanAccessAdmin = true;

		const settingsContent = await AdminSettingsPage();
		const html = renderToStaticMarkup(
			<UserLayout>{settingsContent}</UserLayout>,
		);

		// Must contain unified Shell sidebar structure
		expect(html).toContain("sidebar-user-area");
		expect(html).toContain("locale-switch");
		expect(html).toContain("後台設定");
	});

	it("Task 50.1: covers /app, /course, /agent, and /admin/settings in the unified AppWrapper shell", async () => {
		// Verify /app
		mockPathname = "/app";
		const appContent = await AppPage();
		const appHtml = renderToStaticMarkup(<UserLayout>{appContent}</UserLayout>);
		expect(appHtml).toContain("sidebar-user-area");

		// Verify /course
		mockPathname = "/course";
		const courseContent = await CoursePage();
		const courseHtml = renderToStaticMarkup(<UserLayout>{courseContent}</UserLayout>);
		expect(courseHtml).toContain("sidebar-user-area");

		// Verify /agent
		mockPathname = "/agent";
		const agentContent = await AgentPage();
		const agentHtml = renderToStaticMarkup(<UserLayout>{agentContent}</UserLayout>);
		expect(agentHtml).toContain("sidebar-user-area");

		// Verify /admin/settings
		mockPathname = "/admin/settings";
		mockCanAccessAdmin = true;
		const adminContent = await AdminSettingsPage();
		const adminHtml = renderToStaticMarkup(<UserLayout>{adminContent}</UserLayout>);
		expect(adminHtml).toContain("sidebar-user-area");
	});
});
