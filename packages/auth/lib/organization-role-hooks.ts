import { APIError } from "better-auth/api";
import { db } from "@startkiter/database";

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
	beforeUpdateMemberRole: async ({
		member,
		newRole,
	}: {
		member: { id: string; organizationId: string; role: string };
		newRole: string;
	}) => {
		const role = normalizeOrganizationRoleOrThrow(newRole);

		if (member.role === "owner" && role !== "owner") {
			const ownerCount = await db.member.count({
				where: { organizationId: member.organizationId, role: "owner" },
			});

			if (ownerCount <= 1) {
				throw new APIError("BAD_REQUEST", {
					code: "ORGANIZATION_MUST_HAVE_AN_OWNER",
					message: "An organization must always have exactly one owner",
				});
			}
		}

		if (role === "owner" && member.role !== "owner") {
			await db.$transaction(async (transaction) => {
				await transaction.member.updateMany({
					where: { organizationId: member.organizationId, role: "owner" },
					data: { role: "admin" },
				});
				await transaction.member.update({
					where: { id: member.id },
					data: { role: "owner" },
				});
			});
		}

		return { data: { role } };
	},
	beforeCreateInvitation: async ({ invitation }: { invitation: { role: string } }) => ({
		data: {
			role: normalizeOrganizationRoleOrThrow(invitation.role),
		},
	}),
};
