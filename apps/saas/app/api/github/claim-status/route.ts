import { auth } from "@startkiter/auth";
import { getClaimStatus } from "@startkiter/github-kit";
import { NextResponse } from "next/server";

import {
	createPrismaGrantStore,
	loadGithubKitRuntime,
} from "../../../../lib/github-kit";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const { config, oauthConfigured } = loadGithubKitRuntime();
	const result = await getClaimStatus({
		userId: session?.user.id,
		config,
		oauthConfigured,
		grants: createPrismaGrantStore(),
	});

	if (!result.ok) {
		return NextResponse.json({ error: result.error }, { status: result.httpStatus });
	}

	return NextResponse.json(result.body);
}
