import { describe, expect, it } from "vitest";

import { shouldApplyAssignmentDraftRevision } from "./assignment-draft";

describe("assignment draft revisions", () => {
	it("accepts only a newer client revision", () => {
		expect(shouldApplyAssignmentDraftRevision(0, 1)).toBe(true);
		expect(shouldApplyAssignmentDraftRevision(4, 5)).toBe(true);
		expect(shouldApplyAssignmentDraftRevision(4, 4)).toBe(false);
		expect(shouldApplyAssignmentDraftRevision(5, 4)).toBe(false);
	});

	it("rejects invalid revisions", () => {
		expect(shouldApplyAssignmentDraftRevision(0, -1)).toBe(false);
		expect(shouldApplyAssignmentDraftRevision(0, 1.5)).toBe(false);
	});
});
