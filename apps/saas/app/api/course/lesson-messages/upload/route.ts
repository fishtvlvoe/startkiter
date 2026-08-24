import {
	canAcceptLocalLessonMessageUpload,
	MAX_LOCAL_LESSON_MESSAGE_UPLOAD_TOKEN_LENGTH,
	recordLocalLessonMessageUpload,
	verifyLocalLessonMessageUploadToken,
} from "@startkiter/api/modules/course/procedures/lesson-message-upload";

export async function PUT(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return Response.json({ error: "Local lesson message uploads are disabled in production." }, { status: 404 });
	}

	const token = new URL(request.url).searchParams.get("token");
	if (!token) return Response.json({ error: "Missing upload token." }, { status: 400 });
	if (token.length > MAX_LOCAL_LESSON_MESSAGE_UPLOAD_TOKEN_LENGTH) return Response.json({ error: "Invalid upload token." }, { status: 403 });
	const upload = verifyLocalLessonMessageUploadToken(token);
	if (!upload) return Response.json({ error: "Invalid or expired upload token." }, { status: 403 });
	if (!canAcceptLocalLessonMessageUpload(upload.storageKey)) return Response.json({ error: "Upload object already exists." }, { status: 412 });

	const contentType = request.headers.get("content-type") ?? "application/octet-stream";
	if (contentType !== upload.contentType) return Response.json({ error: "Content type mismatch." }, { status: 415 });
	const declaredLength = request.headers.get("content-length");
	const declaredContentLength = declaredLength ? Number(declaredLength) : null;
	if (declaredContentLength !== null && (!Number.isSafeInteger(declaredContentLength) || declaredContentLength < 1 || declaredContentLength > upload.size)) {
		return Response.json({ error: "Invalid upload size." }, { status: 413 });
	}

	const reader = request.body?.getReader();
	if (!reader) return Response.json({ error: "Missing upload body." }, { status: 400 });
	const body = Buffer.allocUnsafe(upload.size);
	let contentLength = 0;
	try {
		while (true) {
			const chunk = await reader.read();
			if (chunk.done) break;
			if (contentLength + chunk.value.byteLength > upload.size) {
				await reader.cancel();
				return Response.json({ error: "Invalid upload size." }, { status: 413 });
			}
			body.set(chunk.value, contentLength);
			contentLength += chunk.value.byteLength;
		}
	} finally {
		reader.releaseLock();
	}
	if (contentLength !== upload.size || (declaredContentLength !== null && contentLength !== declaredContentLength)) {
		return Response.json({ error: "Invalid upload size." }, { status: 413 });
	}

	recordLocalLessonMessageUpload({ storageKey: upload.storageKey, contentType: upload.contentType, body });
	return Response.json({ ok: true, storageKey: upload.storageKey });
}
