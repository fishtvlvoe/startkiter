import { auth } from "@startkiter/auth";
import { SITE_TEMPLATES } from "@startkiter/platform/src/templates";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user) {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
	}

	return NextResponse.json(SITE_TEMPLATES);
}
