import { afterEach, describe, expect, it, vi } from "vitest";

const { sendMock, getSignedUrlMock } = vi.hoisted(() => ({
	sendMock: vi.fn(),
	getSignedUrlMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => {
	class S3Client {
		send = sendMock;
	}

	class PutObjectCommand {
		input: unknown;
		constructor(input: unknown) {
			this.input = input;
		}
	}

	class GetObjectCommand {
		input: unknown;
		constructor(input: unknown) {
			this.input = input;
		}
	}

	class HeadObjectCommand {
		input: unknown;
		constructor(input: unknown) {
			this.input = input;
		}
	}

	class DeleteObjectCommand {
		input: unknown;
		constructor(input: unknown) {
			this.input = input;
		}
	}

	return {
		S3Client,
		PutObjectCommand,
		GetObjectCommand,
		HeadObjectCommand,
		DeleteObjectCommand,
	};
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: getSignedUrlMock,
}));

vi.mock("@startkiter/logs", () => ({
	logger: { error: vi.fn(), log: vi.fn() },
}));

async function loadS3Provider() {
	vi.stubEnv("S3_ENDPOINT", "https://s3.example.test");
	vi.stubEnv("S3_ACCESS_KEY_ID", "akid");
	vi.stubEnv("S3_SECRET_ACCESS_KEY", "secret");
	vi.stubEnv("S3_REGION", "auto");
	vi.stubEnv("NEXT_PUBLIC_AVATARS_BUCKET_NAME", "avatars");
	return import("./index");
}

describe("s3 storage provider", () => {
	afterEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	it("returns a signed upload URL on success", async () => {
		getSignedUrlMock.mockResolvedValue("https://s3.example.test/signed-upload");
		const { getSignedUploadUrl } = await loadS3Provider();

		await expect(
			getSignedUploadUrl("avatars/user-1.png", {
				bucket: "avatars",
				contentType: "image/png",
			}),
		).resolves.toBe("https://s3.example.test/signed-upload");
		expect(getSignedUrlMock).toHaveBeenCalled();
	});

	it("throws a storage error when signed upload URL generation fails", async () => {
		getSignedUrlMock.mockRejectedValue(new Error("network down"));
		const { getSignedUploadUrl } = await loadS3Provider();

		await expect(
			getSignedUploadUrl("avatars/user-1.png", { bucket: "avatars" }),
		).rejects.toThrow("Could not get signed upload url");
	});

	it("returns null when the object does not exist", async () => {
		sendMock.mockRejectedValue(new Error("NotFound"));
		const { headObject } = await loadS3Provider();

		await expect(headObject("missing.png", "avatars")).resolves.toBeNull();
	});
});
