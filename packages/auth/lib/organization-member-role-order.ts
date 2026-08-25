import type { OrganizationMemberRole } from "./organization-roles";

export const organizationMemberRoleOrder = [
	"owner",
	"admin",
	"instructor",
	"user",
] as const satisfies readonly OrganizationMemberRole[];
