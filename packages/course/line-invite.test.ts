import { describe, expect, it } from "vitest";

import { getLineCommunityInvite, resolveLineCommunityInviteUrl } from "./line-invite";

describe("resolveLineCommunityInviteUrl", () => {
	it("rejects empty and non-https", () => {
		expect(resolveLineCommunityInviteUrl({})).toBeNull();
		expect(
			resolveLineCommunityInviteUrl({
				LINE_COMMUNITY_INVITE_URL: "http://line.me/ti/g/x",
			}),
		).toBeNull();
	});

	it("accepts https invite URL", () => {
		expect(
			resolveLineCommunityInviteUrl({
				LINE_COMMUNITY_INVITE_URL: "https://line.me/ti/g/example",
			}),
		).toBe("https://line.me/ti/g/example");
	});
});

describe("getLineCommunityInvite", () => {
	it("returns 401 without session", async () => {
		const result = await getLineCommunityInvite({
			userId: null,
			inviteUrl: "https://line.me/ti/g/example",
			access: { hasCourseAccess: async () => true },
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 401,
			error: "authentication_required",
		});
	});

	it("returns 403 without courseAccess and omits invite in error shape", async () => {
		const result = await getLineCommunityInvite({
			userId: "user_free",
			inviteUrl: "https://line.me/ti/g/example",
			access: { hasCourseAccess: async () => false },
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.httpStatus).toBe(403);
			expect(result).not.toHaveProperty("inviteUrl");
		}
	});

	it("returns 503 when entitled but URL missing", async () => {
		const result = await getLineCommunityInvite({
			userId: "user_paid",
			inviteUrl: null,
			access: { hasCourseAccess: async () => true },
		});
		expect(result).toEqual({
			ok: false,
			httpStatus: 503,
			error: "invite_not_configured",
		});
	});

	it("returns 200 with inviteUrl when entitled", async () => {
		const result = await getLineCommunityInvite({
			userId: "user_paid",
			inviteUrl: "https://line.me/ti/g/example",
			access: { hasCourseAccess: async () => true },
		});
		expect(result).toEqual({
			ok: true,
			inviteUrl: "https://line.me/ti/g/example",
		});
	});
});
