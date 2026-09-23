"use client";

import { useSession } from "@auth/hooks/use-session";
import { config } from "@config";
import { authClient } from "@startkiter/auth/client";
import type { WorkspaceContext } from "@startkiter/platform/src/workspace/navigation";
import {
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@startkiter/ui";
import { UserAvatar } from "@shared/components/UserAvatar";
import { MoreVerticalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { useIsMobile } from "../hooks/use-media-query";
import { getAccountMenuEntries } from "../lib/account-menu";
import { ThemedIcon } from "../lib/icon-assets";

type UserMenuProps = {
	showUserName?: boolean;
	workspaceContext?: WorkspaceContext;
	appDisplayName?: string;
};

const FALLBACK_WORKSPACE_CONTEXT: WorkspaceContext = {
	scope: "app",
	appId: "account",
	role: "app-user",
};

export function UserMenu({ showUserName, workspaceContext, appDisplayName }: UserMenuProps) {
	const t = useTranslations();
	const { user } = useSession();
	const isMobile = useIsMobile();

	const onLogout = async () => {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					window.location.href = new URL(
						config.redirectAfterLogout,
						window.location.origin,
					).toString();
				},
			},
		});
	};

	if (!user) {
		return null;
	}

	const { name, email, image } = user;
	const dropdownSide = isMobile ? "bottom" : showUserName ? "top" : "right";
	const dropdownAlign = isMobile || !showUserName ? "end" : "start";
	const accountMenuEntries = getAccountMenuEntries(workspaceContext ?? FALLBACK_WORKSPACE_CONTEXT);

	const labelForEntry = (entry: (typeof accountMenuEntries)[number]) =>
		t(entry.labelKey, {
			appName: appDisplayName ?? (workspaceContext?.scope === "app" ? workspaceContext.appId : ""),
		});

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger
				render={(props) => (
					<button
						{...props}
						type="button"
						className={cn(
							props.className,
							"gap-2 md:w-[100%+1rem] md:px-2 md:py-1.5 md:hover:bg-primary/5 flex w-full cursor-pointer items-center justify-between rounded-lg outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
						)}
						aria-label="User menu"
					>
						<span className="gap-2 flex items-center">
							<UserAvatar name={name ?? ""} avatarUrl={image} />
							{showUserName && (
								<span className="leading-tight text-left">
									<span className="font-medium text-sm">{name}</span>
									<span className="text-muted-foreground text-xs block opacity-70">
										{email}
									</span>
								</span>
							)}
						</span>

						{showUserName && <MoreVerticalIcon className="size-4" />}
					</button>
				)}
			/>

			<DropdownMenuContent
				side={dropdownSide}
				align={dropdownAlign}
				className="w-56 max-w-[calc(100vw-2rem)] min-w-0"
				data-testid="account-menu"
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						{name}
						<span className="font-normal text-xs block opacity-70 text-muted-foreground">
							{email}
						</span>
					</DropdownMenuLabel>
				</DropdownMenuGroup>

				<DropdownMenuSeparator />

				{accountMenuEntries.map((entry) => {
					const label = labelForEntry(entry);
					const icon = <ThemedIcon icon={entry.icon} namespace="account" className="mr-2 size-4" />;

					if (entry.id === "logout") {
						return (
							<DropdownMenuItem key={entry.id} onClick={onLogout}>
								{icon}
								{label}
							</DropdownMenuItem>
						);
					}

					return (
						<DropdownMenuItem
							key={entry.id}
							nativeButton={false}
							render={(props) => (
								<Link {...props} href={entry.href} className={cn(props.className, "flex items-center")}>
									{icon}
									{label}
								</Link>
							)}
						/>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
