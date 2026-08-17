import { auth } from "@startkiter/auth";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { grantDemoCourseAccess } from "../../../../lib/demo-grant";

/** 僅本機 Demo：DEMO_GRANT_COURSE=true 時，登入者可一鍵開通 courseAccess。 */
export async function POST(request: Request) {
	if (process.env.DEMO_GRANT_COURSE !== "true") {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}

	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "authentication_required" }, { status: 401 });
	}

	try {
		const order = await grantDemoCourseAccess(session.user.id);
		revalidatePath("/course");
		revalidatePath("/app");
		revalidatePath("/agent");
		revalidatePath("/checkout");
		return NextResponse.json({
			ok: true,
			orderNo: order.orderNo,
			courseAccess: order.courseAccess,
			kitClaimEligible: order.kitClaimEligible,
		});
	} catch {
		return NextResponse.json({ error: "demo_grant_failed" }, { status: 400 });
	}
}
