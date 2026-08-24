import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { getSignedUploadUrl } from "@startkiter/storage/provider/s3";

const LOCAL_TOKEN_VERSION = "assignment-upload-v1";

function getExtension(filename: string): string {
	const match = filename.toLowerCase().match(/\.([a-z0-9]{1,12})$/);
	return match?.[1] ?? "bin";
}

export function buildAssignmentAttachmentStorageKey(input: {
	submissionId: string;
	attachmentId: string;
	filename: string;
}): string {
	return `${input.submissionId}/${input.attachmentId}.${getExtension(input.filename)}`;
}

function getLocalTokenSecret(): string {
	if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
		throw new Error("Missing BETTER_AUTH_SECRET");
	}
	return process.env.BETTER_AUTH_SECRET ?? "startkiter-local-assignment-upload-secret";
}

function signLocalToken(payload: string): string {
	return createHmac("sha256", getLocalTokenSecret()).update(payload).digest("base64url");
}

export function createLocalAssignmentUploadToken(input: {
	storageKey: string;
	contentType: string;
	expiresAt: number;
}): string {
	const payload = Buffer.from(JSON.stringify({
		v: LOCAL_TOKEN_VERSION,
		storageKey: input.storageKey,
		contentType: input.contentType,
		expiresAt: input.expiresAt,
		nonce: randomUUID(),
	}), "utf8").toString("base64url");
	return `${payload}.${signLocalToken(payload)}`;
}

export function verifyLocalAssignmentUploadToken(token: string): {
	storageKey: string;
	contentType: string;
	expiresAt: number;
} | null {
	const [payload, signature] = token.split(".");
	if (!payload || !signature) return null;

	const expected = signLocalToken(payload);
	const actualBuffer = Buffer.from(signature);
	const expectedBuffer = Buffer.from(expected);
	if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;

	try {
		const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
			v?: string;
			storageKey?: string;
			contentType?: string;
			expiresAt?: number;
		};
		if (
			parsed.v !== LOCAL_TOKEN_VERSION ||
			typeof parsed.storageKey !== "string" ||
			!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(parsed.storageKey) ||
			typeof parsed.contentType !== "string" ||
			typeof parsed.expiresAt !== "number" ||
			parsed.expiresAt < Date.now()
		) return null;
		return { storageKey: parsed.storageKey, contentType: parsed.contentType, expiresAt: parsed.expiresAt };
	} catch {
		return null;
	}
}

export async function getAssignmentSignedUploadUrl(input: {
	storageKey: string;
	contentType: string;
}): Promise<{ signedUploadUrl: string; localDevelopment: boolean }> {
	const hasS3Configuration = Boolean(
		process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY,
	);

	if (!hasS3Configuration) {
		if (process.env.NODE_ENV === "production") throw new Error("Assignment storage is not configured");
		const token = createLocalAssignmentUploadToken({
			storageKey: input.storageKey,
			contentType: input.contentType,
			expiresAt: Date.now() + 60_000,
		});
		const baseUrl = process.env.BETTER_AUTH_URL?.startsWith("http://localhost")
			? process.env.BETTER_AUTH_URL
			: "http://localhost:3000";
		return {
			signedUploadUrl: `${baseUrl}/api/assignment/upload?token=${encodeURIComponent(token)}`,
			localDevelopment: true,
		};
	}

	return {
		signedUploadUrl: await getSignedUploadUrl(input.storageKey, {
			bucket: "assignments",
			contentType: input.contentType,
		}),
		localDevelopment: false,
	};
}
