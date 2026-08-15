import { auth } from "@startkiter/auth";
import { NextResponse } from "next/server";

import { operatorHttpStatus } from "../../../../../lib/operator";
import { parsePayuniPatch } from "../../../../../lib/payuni-settings";
import { presentPayuniSettings } from "../../../../../lib/payuni-settings-view";
import { readPayuniSettingsPlain, writePayuniSettings } from "../../../../../lib/site-settings";

async function requireOperator(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const denied = operatorHttpStatus(
		session ? { user: { id: session.user.id, email: session.user.email } } : null,
		process.env.ADMIN_EMAIL,
	);
	if (denied) {
		return {
			error: NextResponse.json(
				{ error: denied === 401 ? "authentication_required" : "forbidden" },
				{ status: denied },
			),
		};
	}

	if (!session) {
		return {
			error: NextResponse.json({ error: "authentication_required" }, { status: 401 }),
		};
	}

	return { session };
}

function publicPayload() {
	return readPayuniSettingsPlain().then((settings) =>
		presentPayuniSettings({
			settings,
			env: process.env,
		}),
	);
}

export async function GET(request: Request) {
	const access = await requireOperator(request);
	if ("error" in access) {
		return access.error;
	}

	const payload = await publicPayload();
	return NextResponse.json(payload);
}

export async function PUT(request: Request) {
	const access = await requireOperator(request);
	if ("error" in access) {
		return access.error;
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = parsePayuniPatch(body);
	if (!parsed.ok) {
		return NextResponse.json({ error: parsed.error }, { status: 400 });
	}

	const written = await writePayuniSettings({
		patch: parsed.patch,
		actorUserId: access.session.user.id,
	});
	if (!written.ok) {
		return NextResponse.json({ error: written.error }, { status: written.httpStatus });
	}

	const payload = await publicPayload();
	return NextResponse.json(payload);
}
