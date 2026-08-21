import { auth } from "@startkiter/auth";
import {
	createGithubVersionFileReader,
	getRepoVersion,
} from "@startkiter/github-kit";
import { NextResponse } from "next/server";

import {
	createPrismaGrantStore,
	loadGithubKitRuntime,
} from "../../../lib/github-kit";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const { config } = loadGithubKitRuntime();
	const versions = config
		? createGithubVersionFileReader(config)
		: { readStartkiterVersion: async () => null };

	const result = await getRepoVersion({
		userId: session?.user.id,
		config,
		grants: createPrismaGrantStore(),
		versions,
	});

	if (!result.ok) {
		return NextResponse.json({ error: result.error }, { status: result.httpStatus });
	}

	return NextResponse.json(result.body);
}
