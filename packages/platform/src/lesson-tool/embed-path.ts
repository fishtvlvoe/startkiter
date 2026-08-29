import { isPrivateOrLocalUrl } from "./url-safety";
import { signLessonToolToken } from "./token";

export function encodeLessonToolOrigin(origin: string): string {
	return Buffer.from(origin, "utf8").toString("base64url");
}

export function decodeLessonToolOrigin(encodedOrigin: string): string | null {
	try {
		const decoded = Buffer.from(encodedOrigin, "base64url").toString("utf8");
		return decoded.length > 0 ? decoded : null;
	} catch {
		return null;
	}
}

export function buildLessonToolEmbedPath(input: {
	lessonId: string;
	userId: string;
	toolUrl: string;
}): { path: string; token: string } | null {
	// 組裝代理路徑當下再檢查一次，避免儲存後 DNS／網址變成內網才被利用
	if (isPrivateOrLocalUrl(input.toolUrl)) {
		return null;
	}

	let origin: string;
	try {
		origin = new URL(input.toolUrl).origin;
	} catch {
		return null;
	}

	const token = signLessonToolToken(input.lessonId, input.userId);
	const encodedOrigin = encodeLessonToolOrigin(origin);
	return {
		path: `/lesson-tool/${encodeURIComponent(input.lessonId)}/${encodedOrigin}?token=${encodeURIComponent(token)}`,
		token,
	};
}
