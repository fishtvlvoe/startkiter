"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { isOrganizationRole, type OrganizationRole } from "./organization";

export type PermissionName =
	| "organization.manage"
	| "organization.manageMembers"
	| "organization.manageInstructors"
	| "organization.viewOrders"
	| "course.manage"
	| "course.viewOwn";

export type PermissionRules = {
	role: OrganizationRole | null;
	manageOrganization: boolean;
	manageMembers: boolean;
	manageInstructors: boolean;
	viewOrganizationOrders: boolean;
	manageCourseContent: boolean;
	viewOwnCourse: boolean;
	check: (permission: PermissionName) => boolean;
};

const permissionContext = createContext<PermissionRules | null>(null);

export function createPermissionRules(role: unknown): PermissionRules {
	const normalizedRole = isOrganizationRole(role) ? role : null;
	const isOwner = normalizedRole === "owner";
	const isAdmin = isOwner || normalizedRole === "admin";
	const canManageCourseContent = isAdmin || normalizedRole === "instructor";

	const rules = {
		role: normalizedRole,
		manageOrganization: isAdmin,
		manageMembers: isAdmin,
		manageInstructors: isAdmin,
		viewOrganizationOrders: isAdmin,
		manageCourseContent: canManageCourseContent,
		viewOwnCourse: normalizedRole !== null,
	};

	return {
		...rules,
		check(permission: PermissionName) {
			switch (permission) {
				case "organization.manage":
					return rules.manageOrganization;
				case "organization.manageMembers":
					return rules.manageMembers;
				case "organization.manageInstructors":
					return rules.manageInstructors;
				case "organization.viewOrders":
					return rules.viewOrganizationOrders;
				case "course.manage":
					return rules.manageCourseContent;
				case "course.viewOwn":
					return rules.viewOwnCourse;
			}
		},
	};
}

export function PermixProvider({ role, children }: { role?: unknown; children: ReactNode }) {
	const rules = useMemo(() => createPermissionRules(role), [role]);
	return <permissionContext.Provider value={rules}>{children}</permissionContext.Provider>;
}

export function usePermissions(): PermissionRules {
	return useContext(permissionContext) ?? createPermissionRules(null);
}

export type { OrganizationRole } from "./organization";
