"use client";
import { useTheme } from "next-themes";
import type { ComponentType } from "react";
import iconAssetRegistry from "./icon-assets.json";
export type IconAsset = { light: string; dark: string };
export type IconAssetId = keyof typeof iconAssetRegistry;
export const ICON_ASSETS = iconAssetRegistry as Record<string, IconAsset>;
function assetIdFor(icon: string, namespace: "nav" | "account"): string {
	return `${namespace}.${icon}`;
}
export function getIconAsset(icon: string, variant: "light" | "dark", namespace: "nav" | "account" = "nav") {
	const assets = ICON_ASSETS[assetIdFor(icon, namespace)] ?? ICON_ASSETS["nav.package"];
	return assets[variant];
}
export function ThemedIcon({
	icon,
	namespace = "nav",
	className,
	}: {
	icon: string;
	namespace?: "nav" | "account";
	className?: string;
}) {
	const { resolvedTheme, theme } = useTheme();
	const variant = (theme === "dark" || (theme === "system" && resolvedTheme === "dark")) ? "dark" : "light";
	return <img src={getIconAsset(icon, variant, namespace)} alt="" aria-hidden="true" className={className} />;
}
export function themedIconComponent(icon: string): ComponentType<{ className?: string }> {
	return function ThemedNavigationIcon({ className }: { className?: string }) {
		return <ThemedIcon icon={icon} className={className} />;
	};
}
