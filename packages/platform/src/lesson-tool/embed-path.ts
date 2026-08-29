import { checkLessonToolUrl, type AddressLookup } from "./url-safety";
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

export async function buildLessonToolEmbedPath(input: {
	lessonId: string;
	userId: string;
	toolUrl: string;
	lookup?: AddressLookup;
}): Promise<{ path: string; token: string } | null> {
	// 組裝代理路徑當下重新解析檢查，避免儲存後 DNS 改指向內網
	const check = await checkLessonToolUrl(input.toolUrl, input.lookup);
	if (!check.ok) {
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
