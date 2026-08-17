import { auth } from "@startkiter/auth";
import {
	getLineCommunityInvite,
	resolveLineCommunityInviteUrl,
} from "@startkiter/course";
import { NextResponse } from "next/server";

import { userHasCourseAccess } from "../../../../lib/course-access";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const result = await getLineCommunityInvite({
		userId: session?.user.id,
		inviteUrl: resolveLineCommunityInviteUrl(process.env),
		access: { hasCourseAccess: userHasCourseAccess },
	});

	if (!result.ok) {
		return NextResponse.json(
			{ error: result.error },
			{
				status: result.httpStatus,
				headers: { "Cache-Control": "private, no-store" },
			},
		);
	}

	return NextResponse.json(
		{ inviteUrl: result.inviteUrl },
		{ headers: { "Cache-Control": "private, no-store" } },
	);
}
