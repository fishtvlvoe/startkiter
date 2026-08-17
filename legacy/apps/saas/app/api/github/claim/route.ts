import { auth } from "@startkiter/auth";
import { claimGithubKit } from "@startkiter/github-kit";
import { NextResponse } from "next/server";

import {
	createConfiguredCollaboratorClient,
	createPrismaEligibilityReader,
	createPrismaGithubIdentityReaderWithUserApi,
	createPrismaGrantStore,
	loadGithubKitRuntime,
} from "../../../../lib/github-kit";

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const { config, oauthConfigured } = loadGithubKitRuntime();
	const collaborators = createConfiguredCollaboratorClient();

	const result = await claimGithubKit({
		userId: session?.user.id,
		config,
		oauthConfigured,
		eligibility: createPrismaEligibilityReader(),
		identity: createPrismaGithubIdentityReaderWithUserApi(),
		grants: createPrismaGrantStore(),
		collaborators: collaborators ?? {
			invitePullCollaborator: async () => {
				throw new Error("misconfigured");
			},
			removeCollaborator: async () => {
				throw new Error("misconfigured");
			},
		},
	});

	if (!result.ok) {
		return NextResponse.json({ error: result.error }, { status: result.httpStatus });
	}

	return NextResponse.json({
		ok: true,
		status: result.status,
		grantId: result.grantId,
		message: "已送出 GitHub 邀請（pull）。請到 GitHub 接受邀請後才能看到私人倉庫。",
	});
}
