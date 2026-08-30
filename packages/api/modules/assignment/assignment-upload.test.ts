import { afterEach, describe, expect, it } from "vitest";

import { buildAssignmentAttachmentStorageKey, canAcceptLocalAssignmentUpload, createLocalAssignmentUploadToken, getAssignmentSignedDownloadUrl, getAssignmentSignedUploadUrl, recordLocalAssignmentUpload, verifyLocalAssignmentUploadToken } from "./assignment-upload";

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
			size: 2048,
			expiresAt: Date.now() + 60_000,
		});

		expect(verifyLocalAssignmentUploadToken(token)).toMatchObject({ maxSize: 4096, size: 2048 });
	});

	it("rejects a second local write to the same storage object", () => {
		const storageKey = `submission-${Date.now()}/attachment-${Date.now()}.pdf`;
		expect(canAcceptLocalAssignmentUpload(storageKey)).toBe(true);
		recordLocalAssignmentUpload({ storageKey, contentType: "application/pdf", contentLength: 10 });
		expect(canAcceptLocalAssignmentUpload(storageKey)).toBe(false);
	});

	it("rejects oversized or structurally ambiguous local tokens before checking the HMAC", () => {
		const token = createLocalAssignmentUploadToken({
			storageKey: "submission-1/attachment-1.pdf",
			contentType: "application/pdf",
			maxSize: 4096,
			size: 2048,
			expiresAt: Date.now() + 60_000,
		});

		expect(verifyLocalAssignmentUploadToken(`${token}${"a".repeat(4096)}`)).toBeNull();
		expect(verifyLocalAssignmentUploadToken(`${token}.extra`)).toBeNull();
	});

	it("uses a download-only local URL for operator attachments", async () => {
		const storageKey = `submission-${Date.now()}/attachment-${Date.now()}.svg`;
		recordLocalAssignmentUpload({ storageKey, contentType: "image/svg+xml", contentLength: 4, body: Buffer.from("<svg") });

		expect(await getAssignmentSignedDownloadUrl({ storageKey, filename: "unsafe\".svg" })).toBe("data:application/octet-stream;base64,PHN2Zw==");
	});

	it("rejects an expired local upload token", () => {
		const token = createLocalAssignmentUploadToken({
			storageKey: "submission-1/attachment-1.pdf",
			contentType: "application/pdf",
			maxSize: 4096,
			size: 2048,
			expiresAt: Date.now() - 1,
		});

		expect(verifyLocalAssignmentUploadToken(token)).toBeNull();
	});
});

describe("assignment signed upload local fallback", () => {
	const previousEnv = {
		NODE_ENV: process.env.NODE_ENV,
		S3_ENDPOINT: process.env.S3_ENDPOINT,
		S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
	};

	afterEach(() => {
		process.env.NODE_ENV = previousEnv.NODE_ENV;
		process.env.S3_ENDPOINT = previousEnv.S3_ENDPOINT;
		process.env.S3_ACCESS_KEY_ID = previousEnv.S3_ACCESS_KEY_ID;
		process.env.S3_SECRET_ACCESS_KEY = previousEnv.S3_SECRET_ACCESS_KEY;
	});

	it("refuses the local upload adapter in production when S3 is not configured", async () => {
		process.env.NODE_ENV = "production";
		delete process.env.S3_ENDPOINT;
		delete process.env.S3_ACCESS_KEY_ID;
		delete process.env.S3_SECRET_ACCESS_KEY;

		await expect(
			getAssignmentSignedUploadUrl({
				storageKey: "submission-1/attachment-1.pdf",
				contentType: "application/pdf",
				maxSize: 4096,
				size: 2048,
			}),
		).rejects.toThrow("Assignment storage is not configured");
	});
});
