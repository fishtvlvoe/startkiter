import { describe, expect, it } from "vitest";

import { decodeAssignmentSubmissionCursor, encodeAssignmentSubmissionCursor } from "./assignment-lifecycle";

describe("assignment lifecycle cursors", () => {
	it("round-trips an opaque operator pagination cursor", () => {
		const cursor = { pluginContentId: "assignment-1", id: "submission-1", submittedAt: "2026-08-24T12:00:00.000Z", createdAt: "2026-08-24T11:00:00.000Z" };
		expect(decodeAssignmentSubmissionCursor(encodeAssignmentSubmissionCursor(cursor))).toEqual(cursor);
	});

	it("rejects malformed or unsafe cursors", () => {
		expect(decodeAssignmentSubmissionCursor("not-a-cursor")).toBeNull();
		expect(decodeAssignmentSubmissionCursor(encodeAssignmentSubmissionCursor({ pluginContentId: "", id: "", submittedAt: "bad", createdAt: "bad" }))).toBeNull();
	});
});
