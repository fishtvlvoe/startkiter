export type CourseVideoProvider = "BUNNY" | "YOUTUBE" | "VIMEO" | "CUSTOM_MP4" | "HLS";

export type ResolvedVideoSource =
	| {
			ok: true;
			provider: CourseVideoProvider;
			sourceId?: string;
			url: string;
			embedUrl?: string;
	  }
	| {
			ok: false;
			error: string;
	  };

function hasAllowedHost(hostname: string, domain: string) {
	return hostname === domain || hostname.endsWith("." + domain);
}

function youtubeVideoId(parsed: URL) {
	if (parsed.hostname === "youtu.be") {
		return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
	}
	if (parsed.pathname === "/watch") {
		return parsed.searchParams.get("v");
	}
	const [, kind, id] = parsed.pathname.split("/");
	return (kind === "embed" || kind === "shorts") && id ? id : null;
}

function isVideoId(value: string | null): value is string {
	return Boolean(value && /^[A-Za-z0-9_-]{6,}$/.test(value));
}

function bunnyEmbedId(parsed: URL) {
	const [mode, libraryId, videoId, ...rest] = parsed.pathname.split("/").filter(Boolean);
	if (
		rest.length > 0 ||
		(mode !== "embed" && mode !== "play") ||
		!libraryId ||
		!videoId ||
		!/^[A-Za-z0-9_-]+$/.test(libraryId) ||
		!/^[A-Za-z0-9_-]+$/.test(videoId)
	) {
		return null;
	}
	return libraryId + "/" + videoId;
}

/** Resolves the five allowed course media sources without browser-only APIs. */
export function resolveVideoSource(inputUrl: string): ResolvedVideoSource {
	const trimmed = inputUrl.trim();
	if (!trimmed.startsWith("https://")) {
		return { ok: false, error: "Only secure HTTPS URLs are allowed." };
	}

	try {
		const parsed = new URL(trimmed);
		const hostname = parsed.hostname.toLowerCase();
		if (hasAllowedHost(hostname, "cloudflarestream.com")) {
			return { ok: false, error: "Cloudflare Stream is not an approved course media provider." };
		}
		const pathname = parsed.pathname.toLowerCase();
		if (pathname.endsWith(".mp4")) {
			return { ok: true, provider: "CUSTOM_MP4", url: trimmed };
		}
		if (pathname.endsWith(".m3u8")) {
			return { ok: true, provider: "HLS", url: trimmed };
		}
		if (hostname === "player.mediadelivery.net" || hostname === "iframe.mediadelivery.net") {
			const sourceId = bunnyEmbedId(parsed);
			return sourceId
				? { ok: true, provider: "BUNNY", sourceId, url: trimmed }
				: { ok: false, error: "Bunny URL must contain an embed/play library and video identifier." };
		}
		if (hasAllowedHost(hostname, "youtube.com") || hostname === "youtu.be") {
			const sourceId = youtubeVideoId(parsed);
			return isVideoId(sourceId)
				? {
						ok: true,
						provider: "YOUTUBE",
						sourceId,
						url: trimmed,
						embedUrl: "https://www.youtube-nocookie.com/embed/" + sourceId + "?enablejsapi=1",
					}
				: { ok: false, error: "YouTube URL is missing a valid video identifier." };
		}
		if (hasAllowedHost(hostname, "vimeo.com")) {
			const sourceId = [...parsed.pathname.split("/").filter(Boolean)]
				.reverse()
				.find((part) => /^\d+$/.test(part));
			return sourceId
				? {
						ok: true,
						provider: "VIMEO",
						sourceId,
						url: trimmed,
						embedUrl: "https://player.vimeo.com/video/" + sourceId,
					}
				: { ok: false, error: "Vimeo URL is missing a valid video identifier." };
		}
		return {
			ok: false,
			error: "Unsupported video host. Supported: Bunny.net, YouTube, Vimeo, direct MP4/HLS.",
		};
	} catch {
		return { ok: false, error: "Invalid URL format." };
	}
}
