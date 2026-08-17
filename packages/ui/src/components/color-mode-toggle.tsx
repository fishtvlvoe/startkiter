"use client";

import { MonitorCogIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "../lib";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

const DEFAULT_THEME = "light";

const COLOR_MODE_LABELS = {
	system: "系統",
	light: "淺色",
	dark: "深色",
} as const;

export function ColorModeToggle() {
	const { setTheme, theme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [value, setValue] = useState<string>(DEFAULT_THEME);

	const colorModeOptions = [
		{
			value: "system",
			icon: MonitorCogIcon,
		},
		{
			value: "light",
			icon: SunIcon,
		},
		{
			value: "dark",
			icon: MoonIcon,
		},
	] as const;

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted && theme) {
			setValue(theme);
		}
	}, [theme, mounted]);

	const displayValue = mounted ? value : DEFAULT_THEME;
	const activeIndex = colorModeOptions.findIndex((option) => option.value === displayValue);

	const handleClick = (optionValue: string) => {
		setTheme(optionValue);
		setValue(optionValue);
	};

	return (
		<TooltipProvider delayDuration={0}>
			<div
				className={cn(
					"color-mode-toggle",
					"gap-0 p-0.5 relative inline-flex items-center rounded-full bg-muted",
				)}
				data-slot="color-mode-toggle"
				data-test="color-mode-toggle"
			>
				<div
					className="left-0.5 top-0.5 h-7 w-7 shadow-sm ease-in-out absolute rounded-full border border-border bg-background transition-transform duration-200"
					style={{
						transform: `translateX(${activeIndex * 100}%)`,
					}}
					aria-hidden="true"
				/>

				{colorModeOptions.map((option) => {
					const Icon = option.icon;
					const isActive = option.value === displayValue;
					const label = COLOR_MODE_LABELS[option.value];

					return (
						<Tooltip key={option.value}>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={() => handleClick(option.value)}
									className={cn(
										"h-7 w-7 relative z-10 flex items-center justify-center rounded-full transition-colors",
										"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
										isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
									)}
									data-test={`color-mode-toggle-item-${option.value}`}
									aria-label={`${label} mode`}
									aria-pressed={isActive}
								>
									<Icon className="size-3.5" />
								</button>
							</TooltipTrigger>
							<TooltipContent>{label}</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
		</TooltipProvider>
	);
}
