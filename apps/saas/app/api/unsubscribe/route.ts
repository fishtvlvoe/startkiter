import { db } from "@startkiter/database";
import {
	applyUnsubscribe,
	recordEmailConsent,
	type UnsubscribeScope,
} from "@startkiter/newsletter";
import { verifyUnsubscribeToken } from "@startkiter/newsletter";
import { NextResponse } from "next/server";

const scopes = new Set<UnsubscribeScope>(["all", "marketing", "general"]);

function isScope(value: unknown): value is UnsubscribeScope {
	return typeof value === "string" && scopes.has(value as UnsubscribeScope);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asBoolean(value: unknown): boolean | undefined {
	if (value === true || value === "true" || value === "on" || value === "1") return true;
	if (value === false || value === "false" || value === "off" || value === "0") return false;
	return undefined;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
	const contentType = request.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		try {
			const value: unknown = await request.json();
			return isRecord(value) ? value : {};
		} catch {
			return {};
		}
	}

	const form = await request.formData();
	return Object.fromEntries(form.entries());
}

async function verifyRequest(input: Record<string, unknown>) {
	const userId = typeof input.userId === "string" ? input.userId : "";
	const email = typeof input.email === "string" ? input.email : "";
	const token = typeof input.token === "string" ? input.token : "";
	const scope = isScope(input.scope) ? input.scope : null;
	if (!userId || !email || !token || !scope || !verifyUnsubscribeToken({ userId, email, scope, token })) {
		return null;
	}

	const user = await db.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			generalEmailConsent: true,
			marketingConsent: true,
			unsubscribedAt: true,
		},
	});
	if (!user || user.email.toLowerCase() !== email.toLowerCase()) return null;

	return { user, userId, email, scope };
}

export async function GET(request: Request) {
	const verified = await verifyRequest(Object.fromEntries(new URL(request.url).searchParams.entries()));
	if (!verified) return NextResponse.json({ error: "invalid_unsubscribe_token" }, { status: 400 });

	return NextResponse.json({
		generalEmailConsent: verified.user.generalEmailConsent,
		marketingConsent: verified.user.marketingConsent === true,
		unsubscribedAt: verified.user.unsubscribedAt,
		scope: verified.scope,
	});
}

export async function POST(request: Request) {
	const body = await readBody(request);
	const verified = await verifyRequest(body);
	if (!verified) return NextResponse.json({ error: "invalid_unsubscribe_token" }, { status: 400 });

	const source = "unsubscribe_page";
	const campaignId = typeof body.campaignId === "string" && body.campaignId ? body.campaignId : null;
	const ip = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() || null;

	if (verified.scope === "marketing") {
		const desired = asBoolean(body.marketingConsent);
		if (desired === true) {
			await recordEmailConsent({ userId: verified.userId, consentType: "MARKETING", action: "GRANTED", source, ip, campaignId });
		} else {
			await applyUnsubscribe({ userId: verified.userId, email: verified.email, scope: "marketing", source, ip, campaignId });
		}
	} else if (verified.scope === "general") {
		const desired = asBoolean(body.generalEmailConsent);
		if (desired === true) {
			await recordEmailConsent({ userId: verified.userId, consentType: "GENERAL", action: "GRANTED", source, ip, campaignId });
		} else {
			await applyUnsubscribe({ userId: verified.userId, email: verified.email, scope: "general", source, ip, campaignId });
		}
	} else if (
		asBoolean(body.unsubscribeAll) === true ||
		(body.preferences === undefined && body.marketingConsent === undefined && body.generalEmailConsent === undefined)
	) {
		await applyUnsubscribe({ userId: verified.userId, email: verified.email, scope: "all", source, ip, campaignId });
	} else {
		const marketing = asBoolean(body.marketingConsent) === true;
		const general = asBoolean(body.generalEmailConsent) === true;
		if (marketing) {
			await recordEmailConsent({ userId: verified.userId, consentType: "MARKETING", action: "GRANTED", source, ip, campaignId });
		} else {
			await applyUnsubscribe({ userId: verified.userId, email: verified.email, scope: "marketing", source, ip, campaignId });
		}
		if (general) {
			await recordEmailConsent({ userId: verified.userId, consentType: "GENERAL", action: "GRANTED", source, ip, campaignId });
		} else {
			await applyUnsubscribe({ userId: verified.userId, email: verified.email, scope: "general", source, ip, campaignId });
		}
	}

	return NextResponse.json({ ok: true });
}
