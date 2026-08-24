import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { getSignedUploadUrl, getSignedUrl } from "@startkiter/storage";
import { headObject } from "@startkiter/storage/provider/s3";

const TOKEN_VERSION = "lesson-message-upload-v1";
const FINALIZE_TOKEN_VERSION = "lesson-message-upload-finalize-v1";
const MAX_TOKEN_LENGTH = 4096;
const LOCAL_OBJECT_TTL_MS = 10 * 60_000;
const MAX_LOCAL_OBJECTS = 100;
const MAX_LOCAL_BYTES = 20 * 1024 * 1024;

const localObjects = new Map<string, { contentType: string; body: Buffer; expiresAt: number }>();

function localSecret(): string {
	if (process.env.NODE_ENV === "production" && !process.env.BETTER_AUTH_SECRET) {
		throw new Error("Missing BETTER_AUTH_SECRET");
	}
	return process.env.BETTER_AUTH_SECRET ?? "startkiter-local-lesson-message-upload-secret";
}

function sign(payload: string): string {
	return createHmac("sha256", localSecret()).update(payload).digest("base64url");
}

function pruneLocalObjects(): void {
	const now = Date.now();
	for (const [key, object] of localObjects) {
		if (object.expiresAt <= now) localObjects.delete(key);
	}
	while (localObjects.size > MAX_LOCAL_OBJECTS) {
		const oldest = localObjects.keys().next().value;
		if (!oldest) break;
		localObjects.delete(oldest);
	}
	let totalBytes = 0;
	for (const object of localObjects.values()) totalBytes += object.body.byteLength;
	while (totalBytes > MAX_LOCAL_BYTES) {
		const oldest = localObjects.keys().next().value;
		if (!oldest) break;
		const object = localObjects.get(oldest);
		totalBytes -= object?.body.byteLength ?? 0;
		localObjects.delete(oldest);
	}
}

export function isLessonMessageStorageConfigured(): boolean {
	return Boolean(process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

export function buildLessonMessageStorageKey(lessonId: string, filename: string): string {
	const extension = filename.toLowerCase().match(/\.([a-z0-9]{1,12})$/)?.[1] ?? "bin";
	return `${lessonId}/${randomUUID()}.${extension}`;
}

export function createLessonMessageUploadToken(input: {
	lessonId: string;
	userId: string;
	storageKey: string;
	contentType: string;
	size: number;
	expiresAt: number;
}): string {
	const payload = Buffer.from(JSON.stringify({
		v: FINALIZE_TOKEN_VERSION,
		lessonId: input.lessonId,
		userId: input.userId,
		storageKey: input.storageKey,
		contentType: input.contentType,
		size: input.size,
		expiresAt: input.expiresAt,
		nonce: randomUUID(),
	}), "utf8").toString("base64url");
	return `${payload}.${sign(payload)}`;
}

export function verifyLessonMessageUploadToken(token: string): {
	lessonId: string;
	userId: string;
	storageKey: string;
	contentType: string;
	size: number;
	expiresAt: number;
} | null {
	if (token.length > MAX_TOKEN_LENGTH) return null;
	const [payload, signature] = token.split(".");
	if (!payload || !signature || signature.length !== 43 || !/^[A-Za-z0-9_-]+$/.test(signature)) return null;
	const actual = Buffer.from(signature);
	const expected = Buffer.from(sign(payload));
	if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
	try {
		const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
		if (
			parsed.v !== FINALIZE_TOKEN_VERSION ||
			typeof parsed.lessonId !== "string" ||
			typeof parsed.userId !== "string" ||
			typeof parsed.storageKey !== "string" ||
			!parsed.storageKey.startsWith(`${parsed.lessonId}/`) ||
			typeof parsed.contentType !== "string" ||
			typeof parsed.size !== "number" ||
			!Number.isSafeInteger(parsed.size) ||
			parsed.size < 1 ||
			typeof parsed.expiresAt !== "number" ||
			parsed.expiresAt < Date.now()
		) return null;
		return {
			lessonId: parsed.lessonId,
			userId: parsed.userId,
			storageKey: parsed.storageKey,
			contentType: parsed.contentType,
			size: parsed.size,
			expiresAt: parsed.expiresAt,
		};
	} catch {
		return null;
	}
}

export function createLocalLessonMessageUploadToken(input: {
	storageKey: string;
	contentType: string;
	maxSize: number;
	 size: number;
	expiresAt: number;
}): string {
	const payload = Buffer.from(JSON.stringify({
		v: TOKEN_VERSION,
		storageKey: input.storageKey,
		contentType: input.contentType,
		maxSize: input.maxSize,
		size: input.size,
		expiresAt: input.expiresAt,
		nonce: randomUUID(),
	}), "utf8").toString("base64url");
	return `${payload}.${sign(payload)}`;
}

export function verifyLocalLessonMessageUploadToken(token: string): {
	storageKey: string;
	contentType: string;
	maxSize: number;
	size: number;
	expiresAt: number;
} | null {
	if (token.length > MAX_TOKEN_LENGTH) return null;
	const [payload, signature] = token.split(".");
	if (!payload || !signature || signature.length !== 43) return null;
	const actual = Buffer.from(signature);
	const expected = Buffer.from(sign(payload));
	if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
	try {
		const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
		if (
			parsed.v !== TOKEN_VERSION ||
			typeof parsed.storageKey !== "string" ||
			!/^[a-zA-Z0-9_-]+\/[a-f0-9-]+\.[a-z0-9]+$/.test(parsed.storageKey) ||
			typeof parsed.contentType !== "string" ||
			typeof parsed.maxSize !== "number" || !Number.isSafeInteger(parsed.maxSize) || parsed.maxSize < 1 ||
			typeof parsed.size !== "number" || !Number.isSafeInteger(parsed.size) || parsed.size < 1 || parsed.size > parsed.maxSize ||
			typeof parsed.expiresAt !== "number" || parsed.expiresAt < Date.now()
		) return null;
		return {
			storageKey: parsed.storageKey,
			contentType: parsed.contentType,
			maxSize: parsed.maxSize,
			size: parsed.size,
			expiresAt: parsed.expiresAt,
		};
	} catch {
		return null;
	}
}

export async function getLessonMessageSignedUploadUrl(input: {
	storageKey: string;
	contentType: string;
	size: number;
	maxSize: number;
}): Promise<{ signedUploadUrl: string; localDevelopment: boolean }> {
	if (isLessonMessageStorageConfigured()) {
		return {
			signedUploadUrl: await getSignedUploadUrl(input.storageKey, {
				bucket: "lessonMessages",
				contentType: input.contentType,
				contentLength: input.size,
				ifNoneMatch: true,
			}),
			localDevelopment: false,
		};
	}
	if (process.env.NODE_ENV === "production") throw new Error("Lesson message storage is not configured");
	if (input.size > Math.min(input.maxSize, 10_000_000)) throw new Error("Lesson message attachment exceeds the development size limit");
	const token = createLocalLessonMessageUploadToken({ ...input, expiresAt: Date.now() + 60_000 });
	const baseUrl = process.env.BETTER_AUTH_URL?.startsWith("http://localhost") ? process.env.BETTER_AUTH_URL : "http://localhost:3000";
	return { signedUploadUrl: `${baseUrl}/api/course/lesson-messages/upload?token=${encodeURIComponent(token)}`, localDevelopment: true };
}

export async function lessonMessageUploadMatches(input: {
	storageKey: string;
	contentType: string;
	size: number;
}): Promise<boolean> {
	if (isLessonMessageStorageConfigured()) {
		const object = await headObject(input.storageKey, "lessonMessages");
		return object?.contentLength === input.size && object.contentType === input.contentType;
	}
	pruneLocalObjects();
	const object = localObjects.get(input.storageKey);
	return object?.body.byteLength === input.size && object.contentType === input.contentType;
}

export function canAcceptLocalLessonMessageUpload(storageKey: string): boolean {
	pruneLocalObjects();
	return !localObjects.has(storageKey);
}

export function recordLocalLessonMessageUpload(input: { storageKey: string; contentType: string; body: Buffer }): void {
	pruneLocalObjects();
	localObjects.set(input.storageKey, { contentType: input.contentType, body: input.body, expiresAt: Date.now() + LOCAL_OBJECT_TTL_MS });
}

export async function getLessonMessageSignedDownloadUrl(input: { storageKey: string; filename: string; mimeType?: string | null }): Promise<string | null> {
	if (isLessonMessageStorageConfigured()) {
		return getSignedUrl(input.storageKey, {
			bucket: "lessonMessages",
			contentType: input.mimeType ?? undefined,
			contentDisposition: `attachment; filename="${input.filename.replace(/["\r\n]/g, "_")}"`,
			expiresIn: 300,
		});
	}
	pruneLocalObjects();
	const object = localObjects.get(input.storageKey);
	return object ? `data:${object.contentType};base64,${object.body.toString("base64")}` : null;
}

export const MAX_LESSON_MESSAGE_ATTACHMENT_SIZE = 10_000_000;
export const MAX_LOCAL_LESSON_MESSAGE_UPLOAD_TOKEN_LENGTH = MAX_TOKEN_LENGTH;
