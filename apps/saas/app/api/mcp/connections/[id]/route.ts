import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { NextResponse } from "next/server";

import { checkMcpConfig, unauthenticatedResponse } from "../../lib/guard";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const configError = checkMcpConfig();
	if (configError) return configError;

	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return unauthenticatedResponse();

	const { id } = await params;

	const connection = await db.mcpConnection.findFirst({
		where: { id, userId: session.user.id, revokedAt: null },
	});

	if (!connection) {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	await db.mcpConnection.update({
		where: { id },
		data: { revokedAt: new Date() },
	});

	return NextResponse.json({ ok: true });
}
