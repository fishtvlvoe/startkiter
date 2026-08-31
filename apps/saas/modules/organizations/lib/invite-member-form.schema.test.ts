import { describe, expect, it } from "vitest";

import { inviteMemberFormSchema } from "./invite-member-form.schema";

describe("inviteMemberFormSchema", () => {
	it("accepts admin, instructor, and user invitation roles", () => {
		for (const role of ["user", "admin", "instructor"] as const) {
			expect(
				inviteMemberFormSchema.safeParse({
					email: "member@example.com",
					role,
				}).success,
			).toBe(true);
		}
	});

	it("rejects owner invitations at the schema boundary", () => {
		const result = inviteMemberFormSchema.safeParse({
			email: "member@example.com",
			role: "owner",
		});

		expect(result.success).toBe(false);
	});
});
