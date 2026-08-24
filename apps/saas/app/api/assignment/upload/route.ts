import { verifyLocalAssignmentUploadToken } from "@startkiter/api/modules/assignment/assignment-upload";

export async function PUT(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return Response.json({ error: "Local assignment uploads are disabled in production." }, { status: 404 });
	}

	const token = new URL(request.url).searchParams.get("token");
	if (!token) return Response.json({ error: "Missing upload token." }, { status: 400 });

	const upload = verifyLocalAssignmentUploadToken(token);
	if (!upload) return Response.json({ error: "Invalid or expired upload token." }, { status: 403 });

	const contentType = request.headers.get("content-type") ?? "application/octet-stream";
	if (contentType !== upload.contentType) return Response.json({ error: "Content type mismatch." }, { status: 415 });

	// Development-only adapter: consume the request to exercise the same browser PUT
	// flow without silently pretending a production object store exists.
	const body = await request.arrayBuffer();
	const declaredLength = request.headers.get("content-length");
	const contentLength = declaredLength ? Number(declaredLength) : body.byteLength;
	if (!Number.isFinite(contentLength) || contentLength < 1 || contentLength > 100_000_000 || body.byteLength > 100_000_000) {
		return Response.json({ error: "Invalid upload size." }, { status: 413 });
	}
	return Response.json({ ok: true, storageKey: upload.storageKey });
}
