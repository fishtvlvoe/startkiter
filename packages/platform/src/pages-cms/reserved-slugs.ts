import { MOUNT_POINTS } from "../mount-points";

const SYSTEM_SEGMENTS = ["api", "admin", "auth", "_next"] as const;

export type SlugCheckResult =
	| { ok: true }
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
		const path = plugin.mount.route?.path;
		if (!path) continue;
		const segment = firstPathSegment(path);
		if (segment) reserved.add(segment);
	}

	return reserved;
}

export function checkSlug(input: {
	slug: string;
	locale: string;
	existing?: ExistingSlug[];
}): SlugCheckResult {
	const slug = input.slug.trim();
	const locale = input.locale.trim();
	const firstSegment = firstPathSegment(slug);
	const reserved = getReservedSlugs();

	if (!firstSegment || reserved.has(firstSegment)) {
		return { ok: false, code: "SLUG_RESERVED" };
	}

	const taken = (input.existing ?? []).some(
		(entry) => entry.slug === slug && entry.locale === locale,
	);
	if (taken) {
		return { ok: false, code: "SLUG_TAKEN" };
	}

	return { ok: true };
}
