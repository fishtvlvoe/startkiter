import {
	canAcceptLocalAssignmentUpload,
	MAX_LOCAL_ASSIGNMENT_UPLOAD_TOKEN_LENGTH,
	recordLocalAssignmentUpload,
	verifyLocalAssignmentUploadToken,
} from "@startkiter/api/modules/assignment/assignment-upload";
import { db } from "@startkiter/database";

export async function PUT(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return Response.json({ error: "Local assignment uploads are disabled in production." }, { status: 404 });
	}

	const token = new URL(request.url).searchParams.get("token");
	if (!token) return Response.json({ error: "Missing upload token." }, { status: 400 });
	if (token.length > MAX_LOCAL_ASSIGNMENT_UPLOAD_TOKEN_LENGTH) return Response.json({ error: "Invalid upload token." }, { status: 403 });

	const upload = verifyLocalAssignmentUploadToken(token);
	if (!upload) return Response.json({ error: "Invalid or expired upload token." }, { status: 403 });
	if (!canAcceptLocalAssignmentUpload(upload.storageKey)) return Response.json({ error: "Upload object already exists." }, { status: 412 });
	const intent = await db.assignmentUploadIntent.findFirst({
		where: { storageKey: upload.storageKey, status: "PENDING", expiresAt: { gt: new Date() }, submission: { status: "DRAFT" } },
		select: { mimeType: true, size: true },
	});
	if (!intent || intent.mimeType !== upload.contentType || intent.size !== upload.size || upload.size > upload.maxSize) return Response.json({ error: "Upload intent is no longer active." }, { status: 409 });

	const contentType = request.headers.get("content-type") ?? "application/octet-stream";
	if (contentType !== upload.contentType) return Response.json({ error: "Content type mismatch." }, { status: 415 });

	const declaredLength = request.headers.get("content-length");
	const declaredContentLength = declaredLength ? Number(declaredLength) : null;
	if (declaredContentLength !== null && (!Number.isSafeInteger(declaredContentLength) || declaredContentLength < 1 || declaredContentLength > intent.size)) {
		return Response.json({ error: "Invalid upload size." }, { status: 413 });
	}

	// Development-only adapter: consume the request to exercise the same browser PUT
	// flow without silently pretending a production object store exists. Read in bounded
	// chunks so a request without a trustworthy Content-Length cannot allocate unbounded memory.
	const reader = request.body?.getReader();
	if (!reader) return Response.json({ error: "Missing upload body." }, { status: 400 });
	let contentLength = 0;
	const body = Buffer.allocUnsafe(intent.size);
	try {
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			if (contentLength + chunk.value.byteLength > intent.size) {
				await reader.cancel();
				return Response.json({ error: "Invalid upload size." }, { status: 413 });
			}
			body.set(chunk.value, contentLength);
			contentLength += chunk.value.byteLength;
		}
	} finally {
		reader.releaseLock();
	}
	if (contentLength < 1 || (declaredContentLength !== null && contentLength !== declaredContentLength)) {
		return Response.json({ error: "Invalid upload size." }, { status: 413 });
	}
	const updated = await db.assignmentUploadIntent.updateMany({
		where: { storageKey: upload.storageKey, status: "PENDING", mimeType: upload.contentType, size: contentLength, expiresAt: { gt: new Date() }, submission: { status: "DRAFT" } },
		data: { status: "UPLOADED" },
	});
	if (updated.count !== 1) return Response.json({ error: "Upload intent is no longer active." }, { status: 409 });
	// Copy the exact payload before retaining it; a subarray would keep the full
	// intent-sized backing buffer alive while the cache accounts only for bytes uploaded.
	const storedBody = Buffer.from(body.subarray(0, contentLength));
	recordLocalAssignmentUpload({ storageKey: upload.storageKey, contentType: upload.contentType, contentLength, body: storedBody });
	return Response.json({ ok: true, storageKey: upload.storageKey });
}
