import { getTestInstance } from "better-auth/test";
import { organization } from "better-auth/plugins";
import { describe, expect, it } from "vitest";

import { organizationRoleHooks } from "./organization-role-hooks";

describe("Better Auth organization role probe", () => {
	it("observes Better Auth's native owner/member values", async () => {
		const { auth, db, signInWithTestUser } = await getTestInstance({
			plugins: [organization()],
		});
		const { headers } = await signInWithTestUser();
		const organizationResult = await auth.api.createOrganization({
			body: { name: "Native Probe Organization", slug: "native-probe-organization" },
			headers,
		});
		const memberUser = await auth.api.signUpEmail({
			body: {
				email: "native-probe-member@example.com",
				password: "test123456",
				name: "Native Probe Member",
			},
		});

		await auth.api.addMember({
			body: {
				organizationId: organizationResult.id,
				userId: memberUser.user.id,
				role: "member",
			},
			headers,
		});

		const members = await db.findMany({
			model: "member",
			where: [{ field: "organizationId", value: organizationResult.id }],
		});

		expect(members.map((member) => (member as { role: string }).role).sort()).toEqual(["member", "owner"]);
	});

	it("records normalized creator and member roles", async () => {
		const { auth, db, signInWithTestUser } = await getTestInstance({
			plugins: [
				organization({
					creatorRole: "owner",
					organizationHooks: organizationRoleHooks,
				}),
			],
		});
		const { headers } = await signInWithTestUser();

		const organizationResult = await auth.api.createOrganization({
			body: { name: "Probe Organization", slug: "probe-organization" },
			headers,
		});
		const memberUser = await auth.api.signUpEmail({
			body: {
				email: "probe-member@example.com",
				password: "test123456",
				name: "Probe Member",
			},
		});

		await auth.api.addMember({
			body: {
				organizationId: organizationResult.id,
				userId: memberUser.user.id,
				role: "member",
			},
			headers,
		});

		const members = await db.findMany({
			model: "member",
			where: [{ field: "organizationId", value: organizationResult.id }],
		});

		expect(members.map((member) => (member as { role: string }).role).sort()).toEqual(["owner", "user"]);

		const ownerMember = members.find((member) => (member as { role: string }).role === "owner");
		expect(ownerMember).toBeDefined();

		await expect(
			auth.api.updateMemberRole({
				body: {
					organizationId: organizationResult.id,
					memberId: (ownerMember as { id: string }).id,
					role: "moderator",
				},
				headers,
			}),
		).rejects.toThrow(/ROLE_NOT_FOUND: moderator|Organization member role must be/);
	});
});
