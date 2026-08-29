import { describe, expect, it } from "vitest";

import { MOUNT_POINTS } from "../mount-points";
import { checkSlug, getReservedSlugs } from "./reserved-slugs";

describe("reserved slug checks (Requirement: Slug must not collide with reserved routes or existing content)", () => {
	it("derives a blacklist from mount point first path segments plus system routes", () => {
		const reserved = getReservedSlugs();

		for (const plugin of MOUNT_POINTS) {
			const path = plugin.mount.route?.path;
			if (!path) continue;
			const firstSegment = path.split("/").filter(Boolean)[0];
			expect(reserved.has(firstSegment!)).toBe(true);
		}

		expect(reserved.has("api")).toBe(true);
		expect(reserved.has("admin")).toBe(true);
		expect(reserved.has("auth")).toBe(true);
		expect(reserved.has("_next")).toBe(true);
	});

	it("rejects a slug whose first segment matches a reserved mount point path", () => {
		const result = checkSlug({ slug: "admin", locale: "zh-tw" });

		expect(result).toEqual({ ok: false, code: "SLUG_RESERVED" });
	});

	it("rejects a nested slug whose first segment is reserved", () => {
		const result = checkSlug({ slug: "course/intro", locale: "zh-tw" });

		expect(result).toEqual({ ok: false, code: "SLUG_RESERVED" });
	});

	it("rejects a slug already used in the same locale", () => {
		const result = checkSlug({
			slug: "about",
			locale: "zh-tw",
			existing: [{ slug: "about", locale: "zh-tw" }],
		});

		expect(result).toEqual({ ok: false, code: "SLUG_TAKEN" });
	});

	it("allows the same slug in a different locale", () => {
		const result = checkSlug({
			slug: "about",
			locale: "en",
			existing: [{ slug: "about", locale: "zh-tw" }],
		});

		expect(result).toEqual({ ok: true, slug: "about" });
	});

	it("rejects dot-segments that would normalize onto a reserved path", () => {
		expect(checkSlug({ slug: "../admin", locale: "zh-tw" })).toEqual({
			ok: false,
			code: "SLUG_RESERVED",
		});
		expect(checkSlug({ slug: "blog/../admin", locale: "zh-tw" })).toEqual({
			ok: false,
			code: "SLUG_RESERVED",
		});
		expect(checkSlug({ slug: "./admin", locale: "zh-tw" })).toEqual({
			ok: false,
			code: "SLUG_RESERVED",
		});
	});

	it("collapses repeated slashes before checking the first segment", () => {
		expect(checkSlug({ slug: "//admin", locale: "zh-tw" })).toEqual({
			ok: false,
			code: "SLUG_RESERVED",
		});
		expect(checkSlug({ slug: "about//us", locale: "zh-tw" })).toEqual({
			ok: true,
			slug: "about/us",
		});
	});

	it("decodes URL encoding before reserved-path comparison", () => {
		expect(checkSlug({ slug: "%2e%2e/admin", locale: "zh-tw" })).toEqual({
			ok: false,
			code: "SLUG_RESERVED",
		});
		expect(checkSlug({ slug: "foo%2f%2e%2e%2fadmin", locale: "zh-tw" })).toEqual({
			ok: false,
			code: "SLUG_RESERVED",
		});
		expect(checkSlug({ slug: "%61dmin", locale: "zh-tw" })).toEqual({
			ok: false,
			code: "SLUG_RESERVED",
		});
	});
});
