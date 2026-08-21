import { auth } from "@startkiter/auth";
import { MOUNT_POINTS } from "@startkiter/platform/src/mount-points";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user) {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
	}

	const plugins = MOUNT_POINTS.map((plugin) => ({
		...plugin,
		enabled: true as const,
	}));

	return NextResponse.json(plugins);
}
