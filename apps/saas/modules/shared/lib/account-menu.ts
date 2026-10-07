import type { WorkspaceContext } from "@startkiter/platform/src/workspace/navigation";

export type AccountMenuEntryId =
	| "user-settings"
	| "platform-admin-settings"
	| "help"
	| "upgrade"
	| "logout";

export type AccountMenuOptions = {
	platformAdmin?: boolean;
};

export type AccountMenuEntry = {
	id: AccountMenuEntryId;
	labelKey: string;
	href: string;
	icon: string;
	visibleWhen: (context: WorkspaceContext, options?: AccountMenuOptions) => boolean;
};

export const ACCOUNT_MENU_ENTRIES: readonly AccountMenuEntry[] = [
	{
		id: "platform-admin-settings",
		labelKey: "app.userMenu.platformAdminSettings",
		href: "/admin/settings",
		icon: "shield-user",
		visibleWhen: (context, options) =>
			options?.platformAdmin !== undefined
				? Boolean(options.platformAdmin && context.scope !== "platform")
				: context.scope === "platform",
	},
	{
		id: "upgrade",
		labelKey: "app.userMenu.subscription",
		href: "/settings/billing",
		icon: "credit-card",
		visibleWhen: () => true,
	},
	{
		id: "logout",
		labelKey: "app.userMenu.logout",
		href: "#logout",
		icon: "log-out",
		visibleWhen: () => true,
	},
];

export function getAccountMenuEntries(
	context: WorkspaceContext,
	options?: AccountMenuOptions,
): AccountMenuEntry[] {
	return ACCOUNT_MENU_ENTRIES.filter((entry) => entry.visibleWhen(context, options));
}
