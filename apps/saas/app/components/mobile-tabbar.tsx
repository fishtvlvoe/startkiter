"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AppShellCurrent } from "./app-shell";

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";

type MobileTabbarProps = {
	current: AppShellCurrent;
	showOperatorSettings?: boolean;
};

type OverflowItem =
	| { kind: "link"; href: string; label: string; icon: string; current: AppShellCurrent }
	| { kind: "placeholder"; label: string; icon: string };

const fixedItems: Array<{ href: string; label: string; icon: string; current: AppShellCurrent }> = [
	{ href: "/app", label: "開始", icon: "⌂", current: "app" },
	{ href: "/course", label: "課程", icon: "▷", current: "course" },
	{ href: "/agent", label: "客服", icon: "◇", current: "agent" },
];

const responsiveStyles = `
@media (max-width: 767px) {
  .app-shell {
    display: block;
    min-height: 100vh;
  }

  .app-sidebar {
    display: none;
  }

  .app-main {
    min-height: 100vh;
    padding: 1.25rem 1rem calc(5.5rem + env(safe-area-inset-bottom));
    border: 0;
  }
}

.mobile-tabbar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.25rem;
  padding: 0.5rem 0.75rem calc(0.5rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--background) 94%, transparent);
  backdrop-filter: blur(16px);
}

.mobile-tabbar a,
.mobile-tabbar button {
  display: grid;
  min-width: 0;
  min-height: 3rem;
  place-items: center;
  gap: 0.1rem;
  padding: 0.35rem 0.2rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
  font: inherit;
  text-decoration: none;
}

.mobile-tabbar a[aria-current="page"] {
  background: var(--muted);
  color: var(--foreground);
  font-weight: 600;
}

.mobile-tab-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.mobile-tab-label {
  font-size: 0.7rem;
  line-height: 1.2;
}

.mobile-more-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 1rem;
  background: rgb(0 0 0 / 35%);
}

.mobile-more-drawer {
  width: min(100%, 28rem);
  max-height: min(70vh, 32rem);
  overflow: auto;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 1rem;
  background: var(--background);
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 20%);
}

.mobile-more-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.mobile-more-close {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--foreground);
  cursor: pointer;
  font: inherit;
}

.mobile-more-list {
  display: grid;
  gap: 0.35rem;
}

.mobile-more-list > a,
.mobile-more-list > span {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.6rem;
  color: var(--foreground);
  text-decoration: none;
}

.mobile-more-list a[aria-current="page"] {
  background: var(--muted);
  font-weight: 600;
}

.mobile-more-list > span {
	border: 1px dashed var(--border);
	color: var(--muted-foreground);
	font-size: 0.875rem;
}

.mobile-more-icon {
	flex-shrink: 0;
}

@media (min-width: 768px) {
  .mobile-tabbar,
  .mobile-more-backdrop {
    display: none;
  }
}
`;

export function MobileTabbar({ current, showOperatorSettings = false }: MobileTabbarProps) {
	const [isNarrow, setIsNarrow] = useState(false);
	const [drawerOpen, setDrawerOpen] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
		const updateViewport = () => {
			setIsNarrow(mediaQuery.matches);
			if (!mediaQuery.matches) {
				setDrawerOpen(false);
			}
		};

		updateViewport();
		window.addEventListener("resize", updateViewport);
		mediaQuery.addEventListener?.("change", updateViewport);

		return () => {
			window.removeEventListener("resize", updateViewport);
			mediaQuery.removeEventListener?.("change", updateViewport);
		};
	}, []);

	const overflowItems: OverflowItem[] = [];
	if (showOperatorSettings) {
		overflowItems.push({ kind: "link", href: "/admin/settings", label: "帳號設定", icon: "⚙", current: "settings" });
	}
	overflowItems.push({ kind: "placeholder", label: "課程內容管理", icon: "▦" });

	if (!isNarrow) {
		return <style data-slot="mobile-tabbar-styles">{responsiveStyles}</style>;
	}

	return (
		<>
			<style data-slot="mobile-tabbar-styles">{responsiveStyles}</style>
			<nav className="mobile-tabbar" data-slot="mobile-tabbar" aria-label="手機版後台選單">
				{fixedItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						data-slot="mobile-tab"
						aria-current={current === item.current ? "page" : undefined}
						aria-label={item.label}
					>
						<span className="mobile-tab-icon" aria-hidden="true">
							{item.icon}
						</span>
						<span className="mobile-tab-label">{item.label}</span>
					</Link>
				))}
				<button
					type="button"
					data-slot="mobile-tab"
					data-test="mobile-more-toggle"
					aria-expanded={drawerOpen}
					aria-haspopup="dialog"
					onClick={() => setDrawerOpen((open) => !open)}
				>
					<span className="mobile-tab-icon" aria-hidden="true">
						⋯
					</span>
					<span className="mobile-tab-label">更多</span>
				</button>
			</nav>

			{drawerOpen ? (
				<div
					className="mobile-more-backdrop"
					data-slot="mobile-more-drawer"
					role="dialog"
					aria-modal="true"
					aria-label="更多選單"
					onClick={() => setDrawerOpen(false)}
				>
					<div className="mobile-more-drawer" onClick={(event) => event.stopPropagation()}>
						<div className="mobile-more-drawer-head">
							<strong>更多</strong>
							<button type="button" className="mobile-more-close" onClick={() => setDrawerOpen(false)}>
								關閉
							</button>
						</div>
						<nav className="mobile-more-list" aria-label="其他後台選單">
							{overflowItems.map((item) =>
								item.kind === "link" ? (
									<Link
										key={item.href}
										href={item.href}
										data-slot="mobile-overflow-item"
										aria-current={current === item.current ? "page" : undefined}
									>
										<span className="mobile-more-icon" aria-hidden="true">
											{item.icon}
										</span>
										{item.label}
									</Link>
								) : (
									<span key={item.label} data-slot="mobile-overflow-item" aria-disabled="true">
										<span className="mobile-more-icon" aria-hidden="true">
											{item.icon}
										</span>
										{item.label}
									</span>
								),
							)}
						</nav>
					</div>
				</div>
			) : null}
		</>
	);
}
