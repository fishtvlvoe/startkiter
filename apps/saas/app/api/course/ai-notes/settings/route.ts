import { readGeminiApiKey } from "@startkiter/api/modules/course/lib/gemini-settings";
import { auth } from "@startkiter/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}

	return NextResponse.json({ configured: Boolean(await readGeminiApiKey(session.user.id)) });
}
