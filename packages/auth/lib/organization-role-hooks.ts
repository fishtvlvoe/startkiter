import { APIError } from "better-auth/api";

import { normalizeOrganizationMemberRole, type OrganizationMemberRole } from "./organization-roles";

function normalizeOrganizationRoleOrThrow(role: string): OrganizationMemberRole {
	try {
		return normalizeOrganizationMemberRole(role);
	} catch {
		throw new APIError("BAD_REQUEST", {
			code: "INVALID_ORGANIZATION_MEMBER_ROLE",
			message: "Organization member role must be owner, admin, instructor, or user",
		});
	}
}

export const organizationRoleHooks = {
	beforeAddMember: async ({ member }: { member: { role: string } }) => ({
		data: {
			role: normalizeOrganizationRoleOrThrow(member.role),
		},
	}),
	beforeUpdateMemberRole: async ({ newRole }: { newRole: string }) => ({
		data: {
			role: normalizeOrganizationRoleOrThrow(newRole),
		},
	}),
	beforeCreateInvitation: async ({ invitation }: { invitation: { role: string } }) => ({
		data: {
			role: normalizeOrganizationRoleOrThrow(invitation.role),
		},
	}),
};
