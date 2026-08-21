"use client";

import { useActiveOrganization } from "@organizations/hooks/use-active-organization";
import { config as authConfig } from "@startkiter/auth/config";
import { config as paymentsConfig } from "@startkiter/payments/config";
import {
	Button,
	cn,
	ColorModeToggle,
	mergeTriggerProps,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Logo,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@startkiter/ui";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@startkiter/ui/components/tooltip";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { NotificationCenter } from "@shared/components/NotificationCenter";
import { usePermissions } from "@shared/components/PermixProvider";
import { UserMenu } from "@shared/components/UserMenu";
import {
	BotMessageSquareIcon,
	BookOpenIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	EllipsisIcon,
	HomeIcon,
	MenuIcon,
	SettingsIcon,
	ShieldUserIcon,
	UserCogIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, type PointerEvent, useMemo, useRef, useState } from "react";

import { OrganzationSelect } from "../../organizations/components/OrganizationSelect";
import { useIsMobile } from "../hooks/use-media-query";
import { getMountMenuItems, getTabBarItems } from "../lib/nav-menu-items";
import { useSidebar } from "../lib/sidebar-context";

interface NavSubItem {
	label: string;
	href: string;
}

interface NavMenuItem {
	id: string;
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	isActive: boolean;
	order: number;
	subItems?: NavSubItem[];
}

interface NavMenuListProps {
	menuItems: NavMenuItem[];
	isCollapsedEffective: boolean;
	listClassName?: string;
	onLinkClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
	home: HomeIcon,
	"book-open": BookOpenIcon,
	"bot-message-square": BotMessageSquareIcon,
	settings: SettingsIcon,
	"shield-user": ShieldUserIcon,
	"user-cog": UserCogIcon,
	ellipsis: EllipsisIcon,
};

function resolveIcon(icon: string): React.ComponentType<{ className?: string }> {
	return iconMap[icon] ?? (() => <span className="size-5 shrink-0 text-center text-xs">{icon}</span>);
}

function isNavSubItemActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}

function NavMenuList({
	menuItems,
	isCollapsedEffective,
	listClassName,
	onLinkClick,
}: NavMenuListProps) {
	const pathname = usePathname();

	return (
		<TooltipProvider delay={0}>
			<ul className={listClassName}>
				{menuItems.map((menuItem) => {
					const parentClasses = cn(
						"gap-3 px-3 py-2 text-sm flex w-full items-center rounded-lg whitespace-nowrap transition-colors",
						{
							"font-semibold bg-touch/10": menuItem.isActive,
							"hover:bg-accent/50": !menuItem.isActive,
							"md:justify-center md:px-2": isCollapsedEffective,
						},
					);

					const parentIcon = (
						<menuItem.icon
							className={cn(
								"size-5 shrink-0",
								menuItem.isActive ? "text-touch" : "text-muted-foreground opacity-60",
							)}
						/>
					);

					if (menuItem.subItems?.length) {
						if (isCollapsedEffective) {
							if (!menuItem.isActive) {
								return (
									<li key={menuItem.id}>
										<Tooltip>
											<TooltipTrigger
												render={(props) => (
													<Link
														{...props}
														href={menuItem.href}
														onClick={(e) => {
															props.onClick?.(e);
															onLinkClick?.();
														}}
														className={cn(props.className, parentClasses)}
														prefetch
													>
														{parentIcon}
													</Link>
												)}
											/>
											<TooltipContent side="right">{menuItem.label}</TooltipContent>
										</Tooltip>
									</li>
								);
							}

							return (
								<li key={menuItem.id} className="w-full">
									<DropdownMenu>
										<Tooltip>
											<TooltipTrigger
												render={(tp) => (
													<DropdownMenuTrigger
														render={(mp) => {
															const m = mergeTriggerProps(tp, mp);
															return (
																<button
																	{...m}
																	type="button"
																	className={cn(m.className as string | undefined, parentClasses)}
																	aria-label={menuItem.label}
																>
																	{parentIcon}
																</button>
															);
														}}
													/>
												)}
											/>
											<TooltipContent side="right">{menuItem.label}</TooltipContent>
										</Tooltip>
										<DropdownMenuContent side="right" align="start" sideOffset={8}>
											<DropdownMenuGroup>
												<DropdownMenuLabel className="font-normal text-muted-foreground">
													{menuItem.label}
												</DropdownMenuLabel>
												{menuItem.subItems.map((subItem) => {
													const subActive = isNavSubItemActive(pathname, subItem.href);
													return (
														<DropdownMenuItem
															key={subItem.href}
															nativeButton={false}
															render={(props) => (
																	<Link
																		{...props}
																		href={subItem.href}
																		className={cn(
																			props.className,
																			"flex w-full cursor-pointer items-center",
																			subActive && "font-semibold",
																		)}
																	>
																		{subItem.label}
																	</Link>
															)}
														/>
													);
												})}
											</DropdownMenuGroup>
										</DropdownMenuContent>
									</DropdownMenu>
								</li>
							);
						}

						return (
							<li key={menuItem.id} className="gap-0.5 flex flex-col">
								<Link href={menuItem.href} onClick={onLinkClick} className={parentClasses} prefetch>
									{parentIcon}
									<span
										className={cn({
											"text-foreground": menuItem.isActive,
											"text-muted-foreground": !menuItem.isActive,
										})}
									>
										{menuItem.label}
									</span>
								</Link>
								{menuItem.isActive && (
									<div className="mt-1 relative">
										{/* Vertical guide: aligned with parent icon center; starts below parent row (no overlap with icon) */}
										<div
											className="top-0 bottom-0 left-5.5 absolute w-px -translate-x-1/2 bg-border/60"
											aria-hidden
										/>
										<ul className="gap-0.5 pl-9 flex flex-col">
											{menuItem.subItems.map((subItem) => {
												const subActive = isNavSubItemActive(pathname, subItem.href);
												return (
													<li key={subItem.href}>
														<Link
															href={subItem.href}
															onClick={onLinkClick}
															className={cn(
																"py-1.5 pl-2 pr-3 text-sm flex w-full items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50",
																subActive && "font-semibold text-foreground",
															)}
															prefetch
														>
															{subItem.label}
														</Link>
													</li>
												);
											})}
										</ul>
									</div>
									)}
								</li>
							);
						}

						const menuItemContent = (
							<Link href={menuItem.href} onClick={onLinkClick} className={parentClasses} prefetch>
								{parentIcon}
								{!isCollapsedEffective && (
									<span
										className={cn({
											"text-foreground": menuItem.isActive,
											"text-muted-foreground": !menuItem.isActive,
										})}
									>
										{menuItem.label}
									</span>
								)}
							</Link>
						);

						if (isCollapsedEffective) {
							return (
								<li key={menuItem.id}>
									<Tooltip>
										<TooltipTrigger
											render={(props) => (
												<Link
													{...props}
													href={menuItem.href}
													onClick={(e) => {
														props.onClick?.(e);
														onLinkClick?.();
													}}
													className={cn(props.className, parentClasses)}
													prefetch
												>
													{parentIcon}
												</Link>
											)}
										/>
										<TooltipContent side="right">{menuItem.label}</TooltipContent>
									</Tooltip>
								</li>
							);
						}

						return <li key={menuItem.id}>{menuItemContent}</li>;
					})}
				</ul>
		</TooltipProvider>
	);
}

interface MobileTabBarProps {
	fixedItems: Array<{
		id: string;
		label: string;
		href: string;
		icon: React.ComponentType<{ className?: string }>;
		isActive: boolean;
	}>;
	moreItem?: {
		label: string;
		subItems?: Array<{ label: string; href: string }>;
		isActive: boolean;
	};
}

function MobileTabBar({ fixedItems, moreItem }: MobileTabBarProps) {
	const [moreOpen, setMoreOpen] = useState(false);
	const pathname = usePathname();

	return (
		<>
			<div
				className="fixed right-0 bottom-0 left-0 z-40 border-t bg-background md:hidden"
				data-testid="mobile-tab-bar"
			>
				<nav className="grid h-16 grid-cols-4 items-center">
					{fixedItems.map((item) => (
						<Link
							key={item.id}
							href={item.href}
							className={cn(
								"flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
								item.isActive ? "text-foreground font-medium" : "text-muted-foreground",
							)}
						>
							<item.icon className="size-5" />
							<span className="truncate max-w-full px-1">{item.label}</span>
						</Link>
					))}
					{moreItem ? (
						<button
							type="button"
							onClick={() => setMoreOpen(true)}
							className={cn(
								"flex flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
								moreItem.isActive ? "text-foreground font-medium" : "text-muted-foreground",
							)}
							aria-label={moreItem.label}
						>
							<EllipsisIcon className="size-5" />
							<span className="truncate max-w-full px-1">{moreItem.label}</span>
						</button>
					) : (
						<span />
					)}
				</nav>
			</div>

			{moreItem && (
				<Sheet open={moreOpen} onOpenChange={setMoreOpen}>
					<SheetContent
						side="bottom"
						className="p-0 pb-6 flex h-auto max-h-[60vh] flex-col rounded-t-xl"
					>
						<SheetHeader className="sr-only">
							<SheetTitle>{moreItem.label}</SheetTitle>
						</SheetHeader>
						<div className="px-4 pt-6">
							<h2 className="mb-2 text-lg font-semibold">{moreItem.label}</h2>
							<ul className="flex list-none flex-col gap-1">
								{moreItem.subItems?.map((subItem) => {
									const subActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`);
									return (
										<li key={subItem.href}>
											<Link
												href={subItem.href}
												onClick={() => setMoreOpen(false)}
												className={cn(
													"block rounded-lg px-3 py-3 text-sm transition-colors",
													subActive
														? "bg-touch/10 font-semibold text-foreground"
														: "text-muted-foreground hover:bg-accent/50",
												)}
											>
												{subItem.label}
											</Link>
										</li>
									);
									})}
								</ul>
						</div>
					</SheetContent>
				</Sheet>
			)}
		</>
	);
}

export function NavBar() {
	const t = useTranslations();
	const pathname = usePathname();
	const { check } = usePermissions();
	const { activeOrganization } = useActiveOrganization();
	const { isCollapsed, toggleCollapsed } = useSidebar();
	const isMobile = useIsMobile();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const canAccessAdmin = check("admin.access");
	const canManageOrganization = check("organization.manage");
	const canManageOrganizationBilling = check("organization.manageBilling");
	/** Avoid double-toggle when a pointer gesture fires both `pointerup` and `click`. */
	const skipClickAfterPointerRef = useRef(false);

	// Never use collapsed style on mobile - always show expanded
	const isCollapsedEffective = isCollapsed && !isMobile;

	function handleSidebarEdgePointerDown(event: PointerEvent<HTMLButtonElement>) {
		if (event.button !== 0) {
			return;
		}
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function handleSidebarEdgePointerUp(event: PointerEvent<HTMLButtonElement>) {
		if (event.button !== 0) {
			return;
		}
		const buttonElement = event.currentTarget;
		if (buttonElement.hasPointerCapture(event.pointerId)) {
			buttonElement.releasePointerCapture(event.pointerId);
		}
		buttonElement.blur();
		skipClickAfterPointerRef.current = true;
		toggleCollapsed();
	}

	function handleSidebarEdgeClick(event: MouseEvent<HTMLButtonElement>) {
		if (skipClickAfterPointerRef.current) {
			event.preventDefault();
			skipClickAfterPointerRef.current = false;
			event.currentTarget.blur();
			return;
		}
		event.currentTarget.blur();
		toggleCollapsed();
	}

	const basePath = activeOrganization ? `/${activeOrganization.slug}` : "";

	const mountMenuItems = useMemo(
		() => getMountMenuItems({ pathname, isOperator: canAccessAdmin }),
		[canAccessAdmin, pathname],
	);

	const { fixed: tabBarFixed, overflow: tabBarOverflow } = useMemo(
		() => getTabBarItems(mountMenuItems),
		[mountMenuItems],
	);

	const menuItems: NavMenuItem[] = useMemo(() => {
		const orgSettingsPrefix = `${basePath}/settings`;
		const organizationSubItems: Array<NavSubItem> | undefined =
			authConfig.organizations.enable && activeOrganization && canManageOrganization
				? [
						{
							label: t("settings.menu.organization.general"),
							href: `${orgSettingsPrefix}/general`,
						},
						{
							label: t("settings.menu.organization.members"),
							href: `${orgSettingsPrefix}/members`,
						},
						...(paymentsConfig.billingAttachedTo === "organization" && canManageOrganizationBilling
							? [
									{
										label: t("settings.menu.organization.billing"),
										href: `${orgSettingsPrefix}/billing`,
									},
								]
							: []),
					]
				: undefined;

		const coreItems: NavMenuItem[] = mountMenuItems.map((item) => ({
			id: item.id,
			label: item.label,
			href: item.href,
			icon: resolveIcon(item.icon),
			isActive: item.isActive,
			order: item.order,
		}));

		const items: NavMenuItem[] = [...coreItems];

		if (organizationSubItems) {
			const insertIndex = items.findIndex((item) => item.order > 5);
			const idx = insertIndex === -1 ? items.length : insertIndex;
			items.splice(idx, 0, {
				id: "organization-settings",
				label: t("app.menu.organizationSettings"),
				href: `${orgSettingsPrefix}/general`,
				icon: SettingsIcon,
				isActive: pathname.startsWith(`${orgSettingsPrefix}/`),
				order: 5,
				subItems: organizationSubItems,
			});
		}

		return items;
	}, [
		activeOrganization,
		basePath,
		canManageOrganization,
		canManageOrganizationBilling,
		mountMenuItems,
		pathname,
		t,
	]);

	const tabBarFixedItems = useMemo(
		() =>
			tabBarFixed.map((item) => ({
				id: item.id,
				label: item.label,
				href: item.href,
				icon: resolveIcon(item.icon),
				isActive: item.isActive,
			})),
		[tabBarFixed],
	);

	const tabBarMoreItem = tabBarOverflow[0]
		? {
				label: tabBarOverflow[0].label,
				subItems: tabBarOverflow[0].subItems,
				isActive: tabBarOverflow[0].isActive,
			}
		: undefined;

	return (
		<>
			<nav
				className={cn(
					"md:fixed md:top-0 md:left-0 md:h-full md:w-[280px] w-full",
					isCollapsedEffective && "md:w-[80px]",
				)}
			>
				<div className="max-w-6xl py-4 md:min-h-0 md:flex md:h-full md:flex-col md:px-4 md:pb-0 container">
					<div className="gap-6 md:shrink-0 flex flex-wrap items-center justify-between">
						<div
							className={cn(
								"gap-1.5 md:flex md:w-full md:flex-col md:items-stretch md:align-stretch flex items-center",
								isCollapsedEffective ? "md:gap-2" : "md:gap-3",
							)}
						>
							<div
								className={cn(
									"gap-4 md:w-full flex items-center",
									isCollapsedEffective
										? "md:flex-col md:items-center md:justify-center md:gap-2"
										: "md:flex-row md:justify-between justify-center",
								)}
							>
								<div className="gap-2 flex shrink-0 items-center justify-center">
									<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
										<SheetTrigger
											render={
												<Button
													variant="ghost"
													size="icon"
													className="md:hidden -ml-1.5 mr-1.5 shrink-0"
													aria-label={t("app.menu.openNavigation")}
													type="button"
												>
													<MenuIcon className="size-5" />
												</Button>
											}
										/>
										<SheetContent
											side="left"
											className="p-0 pt-14 sm:max-w-[280px] flex h-full w-[min(100vw,280px)] flex-col overflow-hidden border-r"
										>
											<SheetHeader className="sr-only">
												<SheetTitle>{t("app.menu.navigationTitle")}</SheetTitle>
											</SheetHeader>
											<div className="min-h-0 px-4 pb-4 flex flex-1 flex-col">
												<div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
													<NavMenuList
														menuItems={menuItems}
														isCollapsedEffective={false}
														listClassName="flex list-none flex-col flex-nowrap items-stretch gap-1 px-0"
														onLinkClick={() => setMobileMenuOpen(false)}
													/>
												</div>
											</div>
										</SheetContent>
									</Sheet>
									<Link href="/" className="block shrink-0">
										<Logo withLabel={false} />
									</Link>
								</div>

								<div className="gap-2 flex items-center justify-end">
									<NotificationCenter
										className="hidden shrink-0 md:flex"
										data-testid="notification-center"
									/>
									<div data-testid="color-mode-toggle">
										<ColorModeToggle
											modes={["system", "light", "dark"]}
											labels={{
												system: t("common.colorMode.system"),
												light: t("common.colorMode.light"),
												dark: t("common.colorMode.dark"),
											}}
										/>
									</div>
								</div>
							</div>

							{authConfig.organizations.enable && !authConfig.organizations.hideOrganization && (
								<>
									{!isCollapsedEffective && (
										<span className="md:hidden opacity-30">
											<ChevronRightIcon className="size-4" />
										</span>
									)}

									<OrganzationSelect
										className={cn(
											isCollapsedEffective ? "md:mt-2" : "md:mt-3",
											isCollapsedEffective && "md:flex md:justify-center",
										)}
										collapsed={isCollapsedEffective}
									/>
								</>
							)}
						</div>

						<div className="mr-0 gap-2 md:hidden ml-auto flex items-center justify-end">
							<NotificationCenter className="shrink-0" data-testid="notification-center" />
							<div data-testid="color-mode-toggle">
								<ColorModeToggle
									modes={["system", "light", "dark"]}
									labels={{
										system: t("common.colorMode.system"),
										light: t("common.colorMode.light"),
										dark: t("common.colorMode.dark"),
									}}
								/>
							</div>
							<UserMenu />
						</div>
					</div>

					<div className="min-h-0 md:flex hidden flex-1 flex-col overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
						<NavMenuList
							menuItems={menuItems}
							isCollapsedEffective={isCollapsedEffective}
							listClassName={cn(
								"md:mx-0 md:mt-3 md:mb-6 md:flex md:flex-col md:flex-nowrap md:items-stretch md:gap-1 md:px-0 md:overflow-visible hidden list-none",
								isCollapsedEffective && "md:items-center",
							)}
						/>
					</div>

					<div
						className={cn(
							"sidebar-user-area mb-0 gap-2 pb-4 md:mt-auto md:flex md:shrink-0 hidden flex-col",
							isCollapsedEffective && "md:items-center",
						)}
						data-testid="sidebar-user-area"
					>
						<div
							className={cn(
								"min-w-0 w-full flex-1",
								isCollapsedEffective && "md:flex md:w-full md:justify-center",
							)}
							data-testid="locale-switch"
						>
							<LocaleSwitch />
						</div>
						<div
							className={cn(
								"min-w-0 w-full flex-1",
								isCollapsedEffective && "md:flex md:w-full md:justify-center",
							)}
						>
							<UserMenu showUserName={!isCollapsedEffective} />
						</div>
					</div>
				</div>

				{/*
					Vercel-style: ~8px to each side of the border (16px = w-4) toggles; chip is
					hidden until the strip is hovered or the control is focused via keyboard.
				*/}
				<button
					type="button"
					data-testid="sidebar-edge-toggle"
					onPointerDown={handleSidebarEdgePointerDown}
					onPointerUp={handleSidebarEdgePointerUp}
					onClick={handleSidebarEdgeClick}
					className={cn(
						"group max-md:hidden pointer-events-auto",
						"md:absolute md:top-0 md:right-0 md:bottom-0 md:z-50 md:min-h-0",
						"md:w-4 md:shrink-0 md:translate-x-1/2",
						"m-0 p-0 cursor-col-resize border-0 bg-transparent outline-none",
					)}
					aria-label={
						isCollapsedEffective ? t("app.menu.expandSidebar") : t("app.menu.collapseSidebar")
					}
				>
					<span
						className={cn(
							"h-7 w-7 absolute top-1/2 left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2",
							"items-center justify-center",
							"rounded-full border border-border bg-background text-muted-foreground",
							"shadow-sm",
							"pointer-events-none",
							"opacity-0 transition-opacity",
							"group-hover:opacity-100",
							"group-focus-visible:opacity-100",
						)}
						aria-hidden
					>
						{isCollapsedEffective ? (
							<ChevronRightIcon className="size-3.5" />
						) : (
							<ChevronLeftIcon className="size-3.5" />
						)}
					</span>
				</button>
			</nav>

			<MobileTabBar fixedItems={tabBarFixedItems} moreItem={tabBarMoreItem} />
		</>
	);
}
