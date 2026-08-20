import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { NextResponse } from "next/server";

import { checkMcpConfig, unauthenticatedResponse } from "../lib/guard";

export async function GET(request: Request) {
	const configError = checkMcpConfig();
	if (configError) return configError;

	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return unauthenticatedResponse();

	const connections = await db.mcpConnection.findMany({
		where: { userId: session.user.id, revokedAt: null },
		orderBy: { authorizedAt: "desc" },
	});

	return NextResponse.json(connections);
}
