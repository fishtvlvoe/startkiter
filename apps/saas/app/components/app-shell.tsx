"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Locale } from "@startkiter/i18n";
import { ColorModeToggle } from "@startkiter/ui";

import type { OrganizationRecord, OrganizationRole } from "../../lib/organization";
import { PermixProvider, usePermissions } from "../../lib/permissions";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileTabbar } from "./mobile-tabbar";
import { OrganizationSelect } from "./organization-select";

const STORAGE_KEY = "startkiter-demo-sidebar-collapsed";

export type AppShellCurrent = "app" | "course" | "agent" | "settings";

export function AppShell({
	...props
}: {
	brand: string;
	email?: string | null;
	name?: string | null;
	locale: Locale;
	current: AppShellCurrent;
	showOperatorSettings?: boolean;
	organizationRole?: OrganizationRole | null;
	organizations?: readonly OrganizationRecord[];
	activeOrganizationId?: string | null;
	onOrganizationChange?: (organization: OrganizationRecord) => void;
	heading: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<PermixProvider role={props.organizationRole}>
			<AppShellContent {...props} />
		</PermixProvider>
	);
}

function AppShellContent({
	brand,
	email,
	name,
	locale,
	current,
	showOperatorSettings = false,
	organizationRole,
	organizations = [],
	activeOrganizationId,
	onOrganizationChange,
	heading,
	children,
}: {
	brand: string;
	email?: string | null;
	name?: string | null;
	locale: Locale;
	current: AppShellCurrent;
	showOperatorSettings?: boolean;
	organizationRole?: OrganizationRole | null;
	organizations?: readonly OrganizationRecord[];
	activeOrganizationId?: string | null;
	onOrganizationChange?: (organization: OrganizationRecord) => void;
	heading: React.ReactNode;
	children: React.ReactNode;
}) {
	const { manageMembers, manageCourseContent } = usePermissions();
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
	}, []);

	function toggle() {
		const next = !collapsed;
		setCollapsed(next);
		localStorage.setItem(STORAGE_KEY, String(next));
	}

	const initial = (name || email || "U").trim().charAt(0).toUpperCase();

	return (
		<>
			<div className={collapsed ? "app-shell is-sidebar-collapsed" : "app-shell"}>
				<aside className="app-sidebar" data-slot="sidebar" data-collapsed={collapsed ? "true" : "false"} id="app-sidebar">
					<div className="sidebar-head">
						<Link className="brand" href="/">
							<span className="brand-mark">開</span>
							<span className="brand-label">{brand}</span>
						</Link>
						<button
							type="button"
							className="sidebar-collapse-toggle"
							data-test="sidebar-collapse-toggle"
							aria-expanded={!collapsed}
							aria-controls="app-sidebar"
							aria-label={collapsed ? "展開側欄" : "收合側欄"}
							onClick={toggle}
						>
							{collapsed ? "›" : "‹"}
						</button>
					</div>
					<nav className="app-nav" aria-label="後台選單">
						<Link href="/app" aria-current={current === "app" ? "page" : undefined} aria-label="開始">
							<span className="nav-icon" aria-hidden="true">
								⌂
							</span>
							<span className="nav-label">開始</span>
						</Link>
						<Link href="/course" aria-current={current === "course" ? "page" : undefined} aria-label="課程">
							<span className="nav-icon" aria-hidden="true">
								▷
							</span>
							<span className="nav-label">課程</span>
						</Link>
						<Link href="/agent" aria-current={current === "agent" ? "page" : undefined} aria-label="站內客服">
							<span className="nav-icon" aria-hidden="true">
								◇
							</span>
							<span className="nav-label">站內客服</span>
						</Link>
						{showOperatorSettings && manageMembers ? (
							<Link href="/admin/settings" aria-current={current === "settings" ? "page" : undefined} aria-label="帳號設定">
								<span className="nav-icon" aria-hidden="true">
									⚙
								</span>
								<span className="nav-label">帳號設定</span>
							</Link>
						) : null}
						{manageCourseContent ? (
							<span className="nav-placeholder" data-slot="course-admin" title="課程內容管理・下一輪 change 接上" aria-disabled="true">
								<span className="nav-icon" aria-hidden="true">
									▦
								</span>
								<span className="nav-label">
									課程內容管理
									<small>下一輪 change 接上</small>
								</span>
							</span>
						) : null}
					</nav>
					<div className="sidebar-user-area">
						<OrganizationSelect
							organizations={organizations}
							activeOrganizationId={activeOrganizationId}
							onOrganizationChange={onOrganizationChange}
						/>
						<div className="app-user" data-slot="sidebar-user">
							<span className="app-avatar">{initial}</span>
							<div className="app-user-meta">
								<div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{name || "學員"}</div>
								<div className="ds-muted" style={{ fontSize: "0.75rem" }}>
									{email}
								</div>
							</div>
							<LocaleSwitcher current={locale} />
						</div>
					</div>
				</aside>
				<div className="app-main">
					<div className="page-header" data-slot="page-header">
						<div>{heading}</div>
						<div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
							<ColorModeToggle
								modes={["system", "light", "dark"]}
								labels={{ system: "系統", light: "淺色", dark: "深色" }}
							/>
						</div>
					</div>
					{children}
				</div>
			</div>
			<MobileTabbar current={current} showOperatorSettings={showOperatorSettings} organizationRole={organizationRole} />
			</>
	);
}
