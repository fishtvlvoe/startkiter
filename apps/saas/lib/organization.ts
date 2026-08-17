export const organizationRoles = ["owner", "admin", "instructor", "user"] as const;

export type OrganizationRole = (typeof organizationRoles)[number];

export type OrganizationMemberRecord = {
	id: string;
	userId: string;
	role: OrganizationRole;
};

export type OrganizationRecord = {
	id: string;
	slug: string;
	name: string;
	member: OrganizationMemberRecord;
};

export function isOrganizationRole(value: unknown): value is OrganizationRole {
	return typeof value === "string" && organizationRoles.includes(value as OrganizationRole);
}
