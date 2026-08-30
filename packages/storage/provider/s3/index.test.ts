import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: vi.fn(),
}));

vi.mock("@startkiter/logs", () => ({
	logger: { error: vi.fn() },
}));

import { getSignedUploadUrl, getSignedUrl } from "./index";

describe("s3 signed URL helpers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.S3_ENDPOINT = "https://s3.example";
		process.env.S3_REGION = "auto";
		process.env.S3_ACCESS_KEY_ID = "test-access-key";
		process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
		process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME = "avatars";
		vi.mocked(getS3SignedUrl).mockResolvedValue("https://s3.example/signed");
	});

	it("passes expiresIn 60 when minting an upload URL for the given key", async () => {
		await expect(
			getSignedUploadUrl("org-42.png", { bucket: "avatars", contentType: "image/png" }),
		).resolves.toBe("https://s3.example/signed");

		expect(getS3SignedUrl).toHaveBeenCalledTimes(1);
		const [, command, options] = vi.mocked(getS3SignedUrl).mock.calls[0] ?? [];
		expect(command).toBeInstanceOf(PutObjectCommand);
		expect((command as PutObjectCommand).input).toMatchObject({
			Bucket: "avatars",
			Key: "org-42.png",
			ContentType: "image/png",
		});
		expect(options).toEqual({ expiresIn: 60 });
	});

	it("forwards the caller expiresIn when minting a download URL", async () => {
		await expect(
			getSignedUrl("user-aaa.png", { bucket: "avatars", expiresIn: 300 }),
		).resolves.toBe("https://s3.example/signed");

		const [, command, options] = vi.mocked(getS3SignedUrl).mock.calls[0] ?? [];
		expect(command).toBeInstanceOf(GetObjectCommand);
		expect((command as GetObjectCommand).input).toMatchObject({
			Bucket: "avatars",
			Key: "user-aaa.png",
		});
		expect(options).toEqual({ expiresIn: 300 });
	});
});
