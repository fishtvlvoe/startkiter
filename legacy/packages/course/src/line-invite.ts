import { MVP_SKU } from "@startkiter/payments";

export function resolveLineCommunityInviteUrl(
	env: Record<string, string | undefined> = process.env,
): string | null {
	const raw = env.LINE_COMMUNITY_INVITE_URL?.trim();
	if (!raw) {
		return null;
	}
	try {
		const url = new URL(raw);
		if (url.protocol !== "https:") {
			return null;
		}
		return url.toString();
	} catch {
		return null;
	}
}

export type LineInviteAccessReader = {
	hasCourseAccess: (userId: string) => Promise<boolean>;
};

export type LineInviteResult =
	| { ok: true; inviteUrl: string }
	| {
			ok: false;
			httpStatus: 401 | 403 | 503;
			error: "authentication_required" | "not_eligible" | "invite_not_configured";
	  };

export async function getLineCommunityInvite(args: {
	userId: string | null | undefined;
	inviteUrl: string | null;
	access: LineInviteAccessReader;
}): Promise<LineInviteResult> {
	if (!args.userId) {
		return { ok: false, httpStatus: 401, error: "authentication_required" };
	}
	const entitled = await args.access.hasCourseAccess(args.userId);
	if (!entitled) {
		return { ok: false, httpStatus: 403, error: "not_eligible" };
	}
	if (!args.inviteUrl) {
		return { ok: false, httpStatus: 503, error: "invite_not_configured" };
	}
	return { ok: true, inviteUrl: args.inviteUrl };
}

export { MVP_SKU };
