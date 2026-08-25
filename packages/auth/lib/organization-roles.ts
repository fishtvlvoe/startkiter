export const organizationMemberRoles = ["owner", "admin", "instructor", "user"] as const;

export type OrganizationMemberRole = (typeof organizationMemberRoles)[number];

function isOrganizationMemberRole(value: string): value is OrganizationMemberRole {
	return (organizationMemberRoles as readonly string[]).includes(value);
}

export function assertOrganizationMemberRole(value: string): OrganizationMemberRole {
	if (!isOrganizationMemberRole(value)) {
		throw new Error(`Invalid organization member role: ${value}`);
	}

	return value;
}

/**
 * Better Auth's built-in member role is kept as an input compatibility alias.
 * It must never be persisted after the organization role migration.
 */
export function normalizeOrganizationMemberRole(value: string): OrganizationMemberRole {
	const normalized = value.trim() === "member" ? "user" : value.trim();
	return assertOrganizationMemberRole(normalized);
}
