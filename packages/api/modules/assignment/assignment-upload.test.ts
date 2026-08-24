import { describe, expect, it } from "vitest";

import { buildAssignmentAttachmentStorageKey, createLocalAssignmentUploadToken, verifyLocalAssignmentUploadToken } from "./assignment-upload";

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

	it("keeps the server-side size limit in the development upload token", () => {
		const token = createLocalAssignmentUploadToken({
			storageKey: "submission-1/attachment-1.pdf",
			contentType: "application/pdf",
			maxSize: 4096,
			expiresAt: Date.now() + 60_000,
		});

		expect(verifyLocalAssignmentUploadToken(token)).toMatchObject({ maxSize: 4096 });
	});
});
