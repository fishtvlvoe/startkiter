import path from "node:path";

import { MOUNT_POINTS } from "../mount-points";

const SYSTEM_SEGMENTS = ["api", "admin", "auth", "_next"] as const;

export type SlugCheckResult =
	| { ok: true; slug: string }
	| { ok: false; code: "SLUG_RESERVED" | "SLUG_TAKEN" };

export type ExistingSlug = {
	slug: string;
	locale: string;
};

function firstPathSegment(value: string): string {
	return value.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
}

export function getReservedSlugs(): Set<string> {
	const reserved = new Set<string>(SYSTEM_SEGMENTS);

	for (const plugin of MOUNT_POINTS) {
		const pathName = plugin.mount.route?.path;
		if (!pathName) continue;
		const segment = firstPathSegment(pathName);
		if (segment) reserved.add(segment);
	}

	return reserved;
}

export function normalizeContentSlug(raw: string): string | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	let decoded = trimmed;
	try {
		decoded = decodeURIComponent(trimmed);
	} catch {
		return null;
	}

	const posixPath = path.posix.normalize(`/${decoded.replace(/^\/+/, "")}`);
	const segments = posixPath.split("/").filter((segment) => segment.length > 0);
	if (segments.length === 0) return null;
	if (segments.some((segment) => segment === "." || segment === "..")) {
		return null;
	}

	return segments.map((segment) => segment.toLowerCase()).join("/");
}

export function checkSlug(input: {
	slug: string;
	locale: string;
	existing?: ExistingSlug[];
}): SlugCheckResult {
	const slug = normalizeContentSlug(input.slug);
	const locale = input.locale.trim();
	if (!slug) {
		return { ok: false, code: "SLUG_RESERVED" };
	}

	const reserved = getReservedSlugs();
	const firstSegment = firstPathSegment(slug);
	if (!firstSegment || reserved.has(firstSegment)) {
		return { ok: false, code: "SLUG_RESERVED" };
	}

	const taken = (input.existing ?? []).some((entry) => {
		const existingSlug = normalizeContentSlug(entry.slug) ?? entry.slug;
		return existingSlug === slug && entry.locale === locale;
	});
	if (taken) {
		return { ok: false, code: "SLUG_TAKEN" };
	}

	return { ok: true, slug };
}
