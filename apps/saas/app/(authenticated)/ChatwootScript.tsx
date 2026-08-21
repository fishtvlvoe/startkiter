"use client";

import { useSession } from "@auth/hooks/use-session";
import { useEffect } from "react";

declare global {
	interface Window {
		chatwootSDK?: {
			run: (config: { websiteToken: string; baseUrl: string }) => void;
		};
		$chatwoot?: {
			setUser: (
				identifier: string,
				user: {
					name?: string | null;
					email?: string | null;
					avatar_url?: string | null;
					identifier_hash?: string | null;
				},
			) => void;
			setCustomAttributes: (attributes: Record<string, unknown>) => void;
			deleteCustomAttribute: (attributeName: string) => void;
			setLocale: (locale: string) => void;
			setLabel: (label: string) => void;
			removeLabel: (label: string) => void;
			toggle: (state?: "open" | "close") => void;
			toggleBubbleVisibility: (visibility: "show" | "hide") => void;
			popoutChatWindow: () => void;
			reset: () => void;
			isOpen?: () => boolean;
		};
	}
}

export interface ChatwootUser {
	id: string;
	email?: string | null;
	name?: string | null;
	image?: string | null;
}

export interface ChatwootDeployment {
	id: string;
	name?: string | null;
	publicUrl?: string | null;
	tier?: string | null;
}

export function initChatwootSdk(options: { websiteToken?: string; baseUrl?: string }): boolean {
	if (!options.websiteToken || typeof window === "undefined") {
		return false;
	}

	const baseUrl = options.baseUrl || "https://chatwoot.startkiter.com";
	const SCRIPT_ID = "chatwoot-sdk-script";

	if (typeof document !== "undefined" && !document.getElementById(SCRIPT_ID)) {
		const script = document.createElement("script");
		script.id = SCRIPT_ID;
		script.src = `${baseUrl}/packs/js/sdk.js`;
		script.defer = true;
		script.async = true;
		script.onload = () => {
			window.chatwootSDK?.run({
				websiteToken: options.websiteToken!,
				baseUrl,
			});
		};
		document.body?.appendChild(script);
	}

	return true;
}

export function syncChatwootUser(user?: ChatwootUser | null): boolean {
	if (typeof window === "undefined" || !window.$chatwoot || !user) {
		return false;
	}

	window.$chatwoot.setUser(user.id, {
		name: user.name || user.email || undefined,
		email: user.email || undefined,
		avatar_url: user.image || undefined,
	});

	return true;
}

export function syncChatwootDeployment(
	deployments?: ChatwootDeployment[] | null,
	selectedDeploymentId?: string | null,
): { selectedId: string | null; needsSelection: boolean } {
	if (!deployments || deployments.length === 0) {
		return { selectedId: null, needsSelection: false };
	}

	// 剛好一個部署：自動帶入
	if (deployments.length === 1 && deployments[0]) {
		const depId = deployments[0].id;
		if (typeof window !== "undefined" && window.$chatwoot) {
			window.$chatwoot.setCustomAttributes({
				buyerDeploymentId: depId,
			});
		}
		return { selectedId: depId, needsSelection: false };
	}

	// 多個部署：若已指定選取的部署則設定，否則需使用者主動選擇
	if (selectedDeploymentId) {
		if (typeof window !== "undefined" && window.$chatwoot) {
			window.$chatwoot.setCustomAttributes({
				buyerDeploymentId: selectedDeploymentId,
			});
		}
		return { selectedId: selectedDeploymentId, needsSelection: false };
	}

	return { selectedId: null, needsSelection: true };
}

export interface ChatwootScriptProps {
	websiteToken?: string;
	baseUrl?: string;
	deployments?: ChatwootDeployment[];
	selectedDeploymentId?: string | null;
}

export function ChatwootScript({
	websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN,
	baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || "https://chatwoot.startkiter.com",
	deployments,
	selectedDeploymentId,
}: ChatwootScriptProps) {
	const { user } = useSession();

	useEffect(() => {
		if (!websiteToken || typeof window === "undefined") {
			return;
		}

		initChatwootSdk({ websiteToken, baseUrl });

		const handleSync = () => {
			syncChatwootUser(user);
			syncChatwootDeployment(deployments, selectedDeploymentId);
		};

		handleSync();
		window.addEventListener("chatwoot:ready", handleSync);

		return () => {
			window.removeEventListener("chatwoot:ready", handleSync);
		};
	}, [websiteToken, baseUrl, user, deployments, selectedDeploymentId]);

	if (!websiteToken) {
		return null;
	}

	return null;
}
