import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

export function useSaveSidebarLayout() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: putSidebarLayout,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: sidebarLayoutQueryKey });
		},
	});
}
