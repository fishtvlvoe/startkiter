import { auth } from "@startkiter/auth";
import { db, type Prisma } from "@startkiter/database";
import { checkSlug } from "@startkiter/platform/src/pages-cms/reserved-slugs";
import {
	restorePage,
	snapshotPage,
	type ContentStatusValue,
	type ContentTypeValue,
	type PageRecord,
	type PageSnapshot,
} from "@startkiter/platform/src/pages-cms/restore";
import { prepareSanitizedPageWrite } from "@startkiter/platform/src/pages-cms/write";

import { resolvePagesCmsAccess } from "./access";

const LOCALES = new Set(["zh-tw", "zh-cn", "en"]);
const TYPES = new Set<ContentTypeValue>(["POST", "PAGE"]);
const STATUSES = new Set<ContentStatusValue>(["DRAFT", "PUBLISHED", "ARCHIVED"]);

type RouteContext = { params: Promise<{ id: string }> };

function json(data: unknown, status = 200) {
	return Response.json(data, { status });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function requireOperator(request: Request): Promise<
	| { ok: true; userId: string }
	| { ok: false; response: Response }
> {
	const session = await auth.api.getSession({ headers: request.headers });
	const access = resolvePagesCmsAccess(session, process.env.ADMIN_EMAIL);
	if (access === 401) {
		return { ok: false, response: json({ error: "UNAUTHORIZED" }, 401) };
	}
	if (access === 403) {
		return { ok: false, response: json({ error: "FORBIDDEN" }, 403) };
	}
	return { ok: true, userId: session!.user.id };
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
	try {
		const parsed: unknown = await request.json();
		return isPlainObject(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function asNullableString(value: unknown): string | null | undefined {
	if (value === undefined) return undefined;
	if (value === null) return null;
	return typeof value === "string" ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
	if (value === undefined) return undefined;
	if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
		return undefined;
	}
	return value;
}

function toSnapshot(page: {
	type: string;
	slug: string;
	locale: string;
	title: string;
	excerpt: string | null;
	body: string;
	coverImageUrl: string | null;
	seoTitle: string | null;
	seoDescription: string | null;
	tags: string[];
	status: string;
	publishedAt: Date | null;
}): PageSnapshot {
	return snapshotPage({
		type: page.type as ContentTypeValue,
		slug: page.slug,
		locale: page.locale,
		title: page.title,
		excerpt: page.excerpt,
		body: page.body,
		coverImageUrl: page.coverImageUrl,
		seoTitle: page.seoTitle,
		seoDescription: page.seoDescription,
		tags: page.tags,
		status: page.status as ContentStatusValue,
		publishedAt: page.publishedAt,
	});
}

function toRecord(page: {
	id: string;
	type: string;
	slug: string;
	locale: string;
	title: string;
	excerpt: string | null;
	body: string;
	coverImageUrl: string | null;
	seoTitle: string | null;
	seoDescription: string | null;
	tags: string[];
	status: string;
	publishedAt: Date | null;
	previousSnapshot: Prisma.JsonValue | null;
}): PageRecord {
	return {
		id: page.id,
		...toSnapshot(page),
		previousSnapshot: parseSnapshot(page.previousSnapshot),
	};
}

function parseSnapshot(value: Prisma.JsonValue | null): PageSnapshot | null {
	if (!isPlainObject(value)) return null;
	if (typeof value.title !== "string" || typeof value.body !== "string" || typeof value.slug !== "string") {
		return null;
	}
	return value as unknown as PageSnapshot;
}

async function findSlugConflict(slug: string, locale: string, excludeId?: string) {
	return db.page.findFirst({
		where: {
			slug,
			locale,
			...(excludeId ? { NOT: { id: excludeId } } : {}),
		},
		select: { slug: true, locale: true },
	});
}

export async function GET(request: Request) {
	const gate = await requireOperator(request);
	if (!gate.ok) return gate.response;

	const pages = await db.page.findMany({ orderBy: { updatedAt: "desc" } });
	return json({ pages, warnings: [] });
}

export async function POST(request: Request) {
	const gate = await requireOperator(request);
	if (!gate.ok) return gate.response;

	const body = await readBody(request);
	if (!body) return json({ error: "invalid_body" }, 400);

	const type = asString(body.type);
	const slug = asString(body.slug)?.trim();
	const locale = asString(body.locale)?.trim();
	const title = asString(body.title)?.trim();
	const rawBody = asString(body.body);
	const statusValue = asString(body.status) ?? "DRAFT";

	if (!type || !TYPES.has(type as ContentTypeValue)) {
		return json({ error: "invalid_type" }, 400);
	}
	if (!slug) return json({ error: "invalid_slug" }, 400);
	if (!locale || !LOCALES.has(locale)) return json({ error: "invalid_locale" }, 400);
	if (!title) return json({ error: "invalid_title" }, 400);
	if (rawBody === undefined) return json({ error: "invalid_body" }, 400);
	if (!STATUSES.has(statusValue as ContentStatusValue)) {
		return json({ error: "invalid_status" }, 400);
	}

	const slugCheck = checkSlug({ slug, locale });
	if (!slugCheck.ok) {
		return json({ error: slugCheck.code }, 400);
	}
	const existing = await findSlugConflict(slugCheck.slug, locale);
	if (existing) {
		return json({ error: "SLUG_TAKEN" }, 400);
	}

	const prepared = prepareSanitizedPageWrite({
		type: type as ContentTypeValue,
		slug: slugCheck.slug,
		locale,
		title,
		excerpt: asNullableString(body.excerpt) ?? null,
		body: rawBody,
		coverImageUrl: asNullableString(body.coverImageUrl) ?? null,
		seoTitle: asNullableString(body.seoTitle) ?? null,
		seoDescription: asNullableString(body.seoDescription) ?? null,
		tags: asStringArray(body.tags) ?? [],
		status: statusValue as ContentStatusValue,
		publishedAt: statusValue === "PUBLISHED" ? new Date() : null,
	});

	const page = await db.page.create({
		data: prepared.data,
	});

	return json({ page, warnings: prepared.warnings }, 201);
}

export async function PATCH(request: Request, context: RouteContext) {
	const gate = await requireOperator(request);
	if (!gate.ok) return gate.response;

	const { id } = await context.params;
	const current = await db.page.findUnique({ where: { id } });
	if (!current) return json({ error: "NOT_FOUND" }, 404);

	const body = await readBody(request);
	if (!body) return json({ error: "invalid_body" }, 400);

	const nextSlug = asString(body.slug)?.trim() ?? current.slug;
	const nextLocale = asString(body.locale)?.trim() ?? current.locale;
	if (!LOCALES.has(nextLocale)) return json({ error: "invalid_locale" }, 400);

	const slugCheck = checkSlug({ slug: nextSlug, locale: nextLocale });
	if (!slugCheck.ok) {
		return json({ error: slugCheck.code }, 400);
	}
	const existing = await findSlugConflict(slugCheck.slug, nextLocale, current.id);
	if (existing) {
		return json({ error: "SLUG_TAKEN" }, 400);
	}

	const nextStatus = (asString(body.status) as ContentStatusValue | undefined) ?? current.status;
	if (!STATUSES.has(nextStatus)) return json({ error: "invalid_status" }, 400);

	let warnings: string[] = [];
	let nextBody = current.body;
	if (body.body !== undefined) {
		const rawBody = asString(body.body);
		if (rawBody === undefined) return json({ error: "invalid_body" }, 400);
		const prepared = prepareSanitizedPageWrite({ body: rawBody });
		nextBody = prepared.data.body;
		warnings = prepared.warnings;
	}

	const data: Prisma.PageUpdateInput = {
		slug: slugCheck.slug,
		locale: nextLocale,
		title: asString(body.title)?.trim() ?? current.title,
		excerpt: body.excerpt !== undefined ? (asNullableString(body.excerpt) ?? null) : current.excerpt,
		body: nextBody,
		coverImageUrl:
			body.coverImageUrl !== undefined
				? (asNullableString(body.coverImageUrl) ?? null)
				: current.coverImageUrl,
		seoTitle: body.seoTitle !== undefined ? (asNullableString(body.seoTitle) ?? null) : current.seoTitle,
		seoDescription:
			body.seoDescription !== undefined
				? (asNullableString(body.seoDescription) ?? null)
				: current.seoDescription,
		tags: asStringArray(body.tags) ?? current.tags,
		status: nextStatus,
		previousSnapshot: toSnapshot(current) as Prisma.InputJsonValue,
	};

	if (body.type !== undefined) {
		const type = asString(body.type);
		if (!type || !TYPES.has(type as ContentTypeValue)) {
			return json({ error: "invalid_type" }, 400);
		}
		data.type = type as ContentTypeValue;
	}

	if (nextStatus === "PUBLISHED" && current.status !== "PUBLISHED") {
		data.publishedAt = new Date();
	}

	const page = await db.page.update({ where: { id }, data });
	return json({ page, warnings });
}

export async function DELETE(request: Request, context: RouteContext) {
	const gate = await requireOperator(request);
	if (!gate.ok) return gate.response;

	const { id } = await context.params;
	const current = await db.page.findUnique({ where: { id } });
	if (!current) return json({ error: "NOT_FOUND" }, 404);

	const page = await db.page.update({
		where: { id },
		data: {
			status: "ARCHIVED",
			previousSnapshot: toSnapshot(current) as Prisma.InputJsonValue,
		},
	});
	return json({ page, warnings: [] });
}

export async function restorePOST(request: Request, context: RouteContext) {
	const gate = await requireOperator(request);
	if (!gate.ok) return gate.response;

	const { id } = await context.params;
	const current = await db.page.findUnique({ where: { id } });
	if (!current) return json({ error: "NOT_FOUND" }, 404);

	const result = restorePage(toRecord(current));
	if (!result.ok) {
		return json({ error: "NO_SNAPSHOT" }, 409);
	}

	const restored = result.page;
	const page = await db.page.update({
		where: { id },
		data: {
			type: restored.type,
			slug: restored.slug,
			locale: restored.locale,
			title: restored.title,
			excerpt: restored.excerpt,
			body: restored.body,
			coverImageUrl: restored.coverImageUrl,
			seoTitle: restored.seoTitle,
			seoDescription: restored.seoDescription,
			tags: restored.tags,
			status: restored.status,
			publishedAt: restored.publishedAt ? new Date(restored.publishedAt) : null,
			previousSnapshot: restored.previousSnapshot as Prisma.InputJsonValue,
		},
	});
	return json({ page, warnings: [] });
}
