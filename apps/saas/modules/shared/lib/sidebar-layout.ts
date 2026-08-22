import { toastError } from "@startkiter/ui/components/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export interface SidebarGroup {
	id: string;
	title: string;
	order: number;
	isCollapsed: boolean;
}

export interface SidebarGroupItem {
	id: string;
	groupId: string;
	menuItemId: string;
	order: number;
}

export interface SidebarLayout {
	groups: SidebarGroup[];
	items: SidebarGroupItem[];
}

export const sidebarLayoutQueryKey = ["sidebar-layout"] as const;

async function fetchSidebarLayout(): Promise<SidebarLayout> {
	const response = await fetch("/api/sidebar-layout");
	if (!response.ok) {
		throw new Error("Failed to fetch sidebar layout");
	}
	return response.json();
}

export function useSidebarLayout() {
	const { data, isLoading } = useQuery({
		queryKey: sidebarLayoutQueryKey,
		queryFn: fetchSidebarLayout,
	});

	return {
		groups: data?.groups ?? [],
		items: data?.items ?? [],
		isLoading,
	};
}

async function putSidebarLayout(layout: SidebarLayout): Promise<void> {
	const response = await fetch("/api/sidebar-layout", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(layout),
	});
	if (!response.ok) {
		throw new Error("Failed to save sidebar layout");
	}
}

/**
 * Takes an updater instead of a fixed layout so rapid consecutive edits (e.g. two
 * quick drags) each compute their diff off the latest known cache, not a stale
 * render closure — otherwise the second write silently clobbers the first.
 */
export function useSaveSidebarLayout() {
	const queryClient = useQueryClient();
	const t = useTranslations();

	return useMutation({
		mutationFn: async (updater: (current: SidebarLayout) => SidebarLayout) => {
			const current = queryClient.getQueryData<SidebarLayout>(sidebarLayoutQueryKey) ?? {
				groups: [],
				items: [],
			};
			const next = updater(current);
			await putSidebarLayout(next);
			return next;
		},
		onSuccess: (next) => {
			queryClient.setQueryData(sidebarLayoutQueryKey, next);
		},
		onError: () => {
			toastError(t("app.menu.saveSidebarLayoutError"));
		},
	});
}
