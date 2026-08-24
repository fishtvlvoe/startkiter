import { describe, expect, it } from "vitest";

import { buildAssignmentAttachmentStorageKey } from "./assignment-upload";

describe("assignment attachment storage keys", () => {
	it("uses generated ids instead of the user supplied filename", () => {
		const key = buildAssignmentAttachmentStorageKey({
			submissionId: "submission-1",
			attachmentId: "attachment-1",
			filename: "../../evil<script>.pdf",
		});

		expect(key).toBe("submission-1/attachment-1.pdf");
		expect(key).not.toContain("evil");
	});
});
