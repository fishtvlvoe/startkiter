const DEMO_VIDEO_SOURCE =
	"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const FORWARDED_RESPONSE_HEADERS = [
	"accept-ranges",
	"cache-control",
	"content-length",
	"content-range",
	"content-type",
	"etag",
	"last-modified",
] as const;

/**
 * Serves the development fallback through the app origin. The browser never
 * requests the external host, so the app's COEP=require-corp policy is kept.
 */
export async function GET(request: Request) {
	try {
		const range = request.headers.get("range");
		const upstream = await fetch(DEMO_VIDEO_SOURCE, {
			headers: range ? { range } : undefined,
		});
		const headers = new Headers();

		for (const name of FORWARDED_RESPONSE_HEADERS) {
			const value = upstream.headers.get(name);
			if (value) headers.set(name, value);
		}

		// The fixed upstream source is an MP4; keep the browser from treating a
		// missing or incorrect upstream MIME type as a text response.
		headers.set("content-type", "video/mp4");
		headers.set("cache-control", "public, max-age=3600");
		headers.set("cross-origin-resource-policy", "same-origin");

		return new Response(upstream.body, {
			status: upstream.status,
			statusText: upstream.statusText,
			headers,
		});
	} catch {
		return new Response("Demo video is temporarily unavailable.", { status: 502 });
	}
}
