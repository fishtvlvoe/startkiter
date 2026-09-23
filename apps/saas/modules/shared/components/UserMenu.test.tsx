import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@auth/hooks/use-session", () => ({
	useSession: () => ({
		user: { id: "user-1", name: "Fish", email: "fish@example.com", image: null },
	}),
}));

vi.mock("@config", () => ({
	config: {
		docsUrl: "https://docs.example.com",
		marketingUrl: "https://startkiter.dev",
		redirectAfterLogout: "/login",
	},
}));

vi.mock("@startkiter/auth/client", () => ({
	authClient: { signOut: vi.fn() },
}));

vi.mock("@shared/components/UserAvatar", () => ({
	UserAvatar: ({ name }: { name: string }) => <span data-testid="user-avatar">{name}</span>,
}));

vi.mock("../hooks/use-media-query", () => ({
	useIsMobile: () => false,
}));

vi.mock("next-intl", () => ({
	useTranslations: () => (key: string) =>
		({
			"app.userMenu.learningCenter": "我的學習中心",
			"app.userMenu.subscription": "我的訂閱",
			"app.userMenu.logout": "登出",
			"app.userMenu.accountSettings": "帳號設定",
			"app.userMenu.appAdminSettings": "課程管理員設定",
			"app.userMenu.platformAdminSettings": "總管理員設定",
			"app.userMenu.documentation": "文件",
			"app.userMenu.home": "首頁",
		}[key] ?? key),
}));

vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@startkiter/ui", () => {
	const renderable = ({
		children,
		render,
		...props
	}: {
		children?: React.ReactNode;
		render?: (props: Record<string, unknown>) => React.ReactNode;
		[key: string]: unknown;
	}) => {
		if (render) {
			return render({ className: "", ...props });
		}
		return <div {...props}>{children}</div>;
	};

	return {
		cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(" "),
		DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
		DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
		DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
		DropdownMenuItem: ({ children, render, ...props }: Parameters<typeof renderable>[0]) => (
			<div data-testid="dropdown-item">
				{render ? render({ className: "", ...props }) : children}
			</div>
		),
		DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
		DropdownMenuSeparator: () => <hr />,
		DropdownMenuTrigger: renderable,
	};
});

import { UserMenu } from "./UserMenu";

describe("UserMenu personal navigation", () => {
	it("shows user settings for every workspace context", () => {
		const UserMenuForTest = UserMenu as React.ComponentType<Record<string, unknown>>;
		const contexts = [
			{ scope: "app", appId: "course", role: "app-user" },
			{ scope: "app", appId: "course", role: "app-admin" },
			{ scope: "platform" },
		];

		for (const workspaceContext of contexts) {
			const html = renderToStaticMarkup(
				<UserMenuForTest
					showUserName
					workspaceContext={workspaceContext}
					appDisplayName="課程"
				/>,
			);

			expect(html).toContain('href="/settings/general"');
		}
	});

	it("derives admin settings visibility from the workspace context", () => {
		const UserMenuForTest = UserMenu as React.ComponentType<Record<string, unknown>>;
		const appUserHtml = renderToStaticMarkup(
			<UserMenuForTest workspaceContext={{ scope: "app", appId: "course", role: "app-user" }} />,
		);
		const appAdminHtml = renderToStaticMarkup(
			<UserMenuForTest
				workspaceContext={{ scope: "app", appId: "course", role: "app-admin" }}
				appDisplayName="課程"
			/>,
		);
		const platformHtml = renderToStaticMarkup(
			<UserMenuForTest workspaceContext={{ scope: "platform" }} />,
		);

		expect(appUserHtml).not.toContain('href="/admin/course/settings"');
		expect(appAdminHtml).toContain('href="/admin/course/settings"');
		expect(appAdminHtml).toContain("課程管理員設定");
		expect(platformHtml).toContain('href="/admin/settings"');
		expect(platformHtml).toContain("總管理員設定");
	});

	it("keeps help, upgrade, and logout available without top-level theme or locale controls", () => {
		const html = renderToStaticMarkup(<UserMenu showUserName />);

		expect(html).toContain("Fish");
		expect(html).toContain("fish@example.com");
		expect(html).toContain('href="/support"');
		expect(html).toContain("文件");
		expect(html).toContain('href="/settings/billing"');
		expect(html).toContain("我的訂閱");
		expect(html).toContain("登出");
		expect(html).not.toContain("color-mode-toggle");
		expect(html).not.toContain("locale-switch");
		expect((html.match(/data-testid="dropdown-item"/g) ?? []).length).toBeGreaterThanOrEqual(4);
	});
});
