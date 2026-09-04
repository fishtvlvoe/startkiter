import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { validateCoursePackEnvelope } from "./schema";

const fixture = JSON.parse(
	readFileSync(
		"/Users/fishtv/Development/A-神系列/Awesome-Koson/src/fixtures/saas-payment-course-pack.json",
		"utf8",
	),
);

describe("CoursePackEnvelopeSchema", () => {
	it("accepts the Awesome-Koson fixture", () => {
		const result = validateCoursePackEnvelope(fixture);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.course_pack.id).toBe("saas-payment-mvp");
			expect(result.errors).toEqual([]);
		}
	});

	it("rejects a mission without evaluator", () => {
		const invalid = structuredClone(fixture);
		delete invalid.course_pack.missions[0].evaluator;

		const result = validateCoursePackEnvelope(invalid);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ path: "course_pack.missions.0.evaluator" }),
			]),
		);
		}
	});

	it("rejects an unsupported schema version", () => {
		const invalid = { ...fixture, schema_version: "2.0.0" };

		const result = validateCoursePackEnvelope(invalid);

		expect(result.success).toBe(false);
	});

	it("rejects an unsupported target runtime", () => {
		const invalid = { ...fixture, target_runtime: "other-platform" };

		const result = validateCoursePackEnvelope(invalid);

		expect(result.success).toBe(false);
	});

	it("rejects an empty mission list", () => {
		const invalid = {
			...fixture,
			course_pack: { ...fixture.course_pack, missions: [] },
		};

		const result = validateCoursePackEnvelope(invalid);

		expect(result.success).toBe(false);
	});
});
