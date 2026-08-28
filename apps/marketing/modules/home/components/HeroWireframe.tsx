"use client";

import { cn, Logo } from "@startkiter/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@startkiter/ui/components/card";
import {
	BotMessageSquareIcon,
	ChevronsUpDownIcon,
	EllipsisVerticalIcon,
	HomeIcon,
	PanelLeftIcon,
	SettingsIcon,
	UserCogIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

const PREVIEW_ADDRESS = "app.startkiter.dev";
const NAVIGATION_ITEMS = [
	{ key: "start", icon: HomeIcon, active: true },
	{ key: "chatbot", icon: BotMessageSquareIcon, active: false },
	{ key: "organizationSettings", icon: SettingsIcon, active: false },
	{ key: "accountSettings", icon: UserCogIcon, active: false },
] as const;

const METRIC_CARDS = [
	{
		key: "courseContent",
		color: "#3b82f6",
	},
	{
		key: "codeDelivery",
		color: "#10b981",
	},
	{
		key: "moduleGrowth",
		color: "#8b5cf6",
	},
] as const;

export function HeroWireframe() {
	const t = useTranslations("home.hero");

	return (
		<figure className="shadow-olive-950/30 dark:shadow-black/70 m-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_80px_-32px]">
			<figcaption className="sr-only">{t("imageAlt")}</figcaption>
			<div aria-hidden className="pointer-events-none select-none">
				<BrowserChrome />
				<div className="md:min-h-[28rem] flex min-h-[22rem]">
					<Sidebar />
					<MainPreview />
				</div>
			</div>
		</figure>
	);
}

function BrowserChrome() {
	return (
		<div className="gap-3 px-3 py-2 grid grid-cols-[auto_1fr_auto] items-center border-b border-border/60">
			<div className="gap-1.5 flex items-center">
				<span className="size-2.5 rounded-full bg-[#FF5F57]" />
				<span className="size-2.5 rounded-full bg-[#FEBC2E]" />
				<span className="size-2.5 rounded-full bg-[#28C840]" />
			</div>
			<div className="max-w-xs px-3 py-1 text-xs mx-auto w-full truncate rounded-md bg-muted/70 text-center text-foreground/40">
				{PREVIEW_ADDRESS}
			</div>
			<div className="w-[42px]" />
		</div>
	);
}

function Sidebar() {
	const t = useTranslations("home.hero.preview");

	return (
		<aside className="w-52 p-3 md:flex hidden shrink-0 flex-col border-r border-border/60">
			<div className="mb-3 flex items-center justify-between">
				<Logo withLabel={false} className="[&>svg]:size-6" />
				<PanelLeftIcon className="size-3.5 text-foreground/35" />
			</div>

			<div className="gap-2 px-2 py-1.5 mb-4 flex items-center rounded-lg border border-border/70 bg-background">
				<span className="size-6 flex items-center justify-center rounded-md bg-foreground/8">
					<Logo withLabel={false} className="[&>svg]:size-3.5" />
				</span>
				<span className="min-w-0 font-medium text-xs flex-1 truncate">{t("organization")}</span>
				<ChevronsUpDownIcon className="size-3 text-foreground/35" />
			</div>

			<nav className="gap-0.5 flex flex-col">
				{NAVIGATION_ITEMS.map((item) => (
					<NavigationItem
						key={item.key}
						icon={item.icon}
						label={t(item.key)}
						active={item.active}
					/>
				))}
			</nav>

			<div className="gap-2 pt-4 mt-auto flex items-center">
				<div className="size-7 flex shrink-0 items-center justify-center rounded-full border border-touch/20 bg-touch/8 text-touch">
					<Logo withLabel={false} className="[&>svg]:size-3.5" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="font-medium text-xs truncate text-foreground">{t("userName")}</p>
					<p className="text-xs truncate text-foreground/40">{t("userEmail")}</p>
				</div>
				<EllipsisVerticalIcon className="size-3.5 text-foreground/35" />
			</div>
		</aside>
	);
}

function NavigationItem({
	icon: Icon,
	label,
	active,
}: {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	active: boolean;
}) {
	return (
		<div
			className={cn(
				"gap-2 px-2 py-1.5 text-xs flex items-center rounded-md",
				active ? "font-medium bg-touch/10 text-foreground" : "text-foreground/50",
			)}
		>
			<Icon className={cn("size-3.5 shrink-0", active && "text-touch")} />
			<span className="truncate">{label}</span>
		</div>
	);
}

function MainPreview() {
	const t = useTranslations("home.hero.preview");

	return (
		<div className="min-w-0 p-4 sm:p-5 lg:p-6 flex-1 bg-muted/35">
			<h3 className="font-medium text-xl tracking-tight lg:text-2xl text-foreground">
				{t("organization")}
			</h3>
			<p className="mt-1 text-sm text-foreground/50">{t("welcome")}</p>

			<div className="mt-5 gap-3 sm:grid-cols-3 grid grid-cols-1">
				{METRIC_CARDS.map((metricCard) => (
					<PreviewCard
						key={metricCard.key}
						title={t(metricCard.key)}
						color={metricCard.color}
					/>
				))}
			</div>

			<Card className="mt-4 rounded-xl">
				<div className="h-36 sm:h-44 lg:h-52 text-sm flex items-center justify-center text-foreground/45">
					{t("contentPreview")}
				</div>
			</Card>
		</div>
	);
}

function PreviewCard({
	title,
	color,
}: {
	title: string;
	color: string;
}) {
	return (
		<Card className="rounded-xl">
			<CardHeader className="p-3.5 pb-2">
				<CardTitle className="font-medium text-xs text-foreground/50">{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-3.5 pt-0">
				<div className="h-12 gap-1 flex items-end" aria-hidden>
					{["h-5", "h-8", "h-11", "h-7"].map((height) => (
						<span
							key={height}
							className={cn("w-1/4 rounded-t-sm opacity-70", height)}
							style={{ backgroundColor: color }}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
