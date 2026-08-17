"use client";

import { useEffect, useState } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@startkiter/ui";

import type { OrganizationRecord } from "../../lib/organization";

export function OrganizationSelect({
	organizations,
	activeOrganizationId,
	onOrganizationChange,
}: {
	organizations: readonly OrganizationRecord[];
	activeOrganizationId?: string | null;
	onOrganizationChange?: (organization: OrganizationRecord) => void;
}) {
	const [activeId, setActiveId] = useState(activeOrganizationId ?? organizations[0]?.id ?? null);

	useEffect(() => {
		setActiveId(activeOrganizationId ?? organizations[0]?.id ?? null);
	}, [activeOrganizationId, organizations]);

	if (organizations.length < 2) {
		return null;
	}

	const activeOrganization = organizations.find((organization) => organization.id === activeId) ?? organizations[0];

	function selectOrganization(organizationId: string) {
		const organization = organizations.find((candidate) => candidate.id === organizationId);
		if (!organization) {
			return;
		}

		setActiveId(organization.id);
		onOrganizationChange?.(organization);
	}

	return (
		<div data-testid="organization-scope" data-active-organization-id={activeOrganization.id} data-slot="organization-select">
			<DropdownMenu>
				<DropdownMenuTrigger
					render={(props) => (
						<button
							{...props}
							type="button"
							data-slot="organization-select-trigger"
							aria-label="切換組織"
							className="organization-select-trigger"
						>
							<span>{activeOrganization.name}</span>
							<span aria-hidden="true">⌄</span>
						</button>
					)}
				/>
				<DropdownMenuContent align="start" className="organization-select-content">
					<DropdownMenuRadioGroup value={activeOrganization.id} onValueChange={selectOrganization}>
						{organizations.map((organization) => (
							<DropdownMenuRadioItem
								key={organization.id}
								value={organization.id}
								data-organization-id={organization.id}
							>
								{organization.name}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
