export type ResolvedVideoSource =
	| {
			ok: true;
			provider: "BUNNY" | "YOUTUBE" | "VIMEO" | "CUSTOM_MP4" | "HLS";
			sourceId?: string;
			url: string;
	  }
	| {
			ok: false;
			error: string;
	  };

export function resolveVideoSource(inputUrl: string): ResolvedVideoSource {
	const trimmed = inputUrl.trim();
	if (!trimmed.startsWith("https://")) {
		return { ok: false, error: "Only secure HTTPS URLs are allowed." };
	}

	try {
		const parsed = new URL(trimmed);

		// 1. Bunny Stream / CDN
		if (
			parsed.hostname.includes("mediadelivery.net") ||
			parsed.hostname.includes("bunny.net") ||
			parsed.hostname.includes("b-cdn.net")
		) {
			const pathParts = parsed.pathname.replace(/^\/play\//, "").replace(/^\//, "");
			return {
				ok: true,
				provider: "BUNNY",
				sourceId: pathParts,
				url: trimmed,
			};
		}

		// 2. YouTube
		if (
			parsed.hostname === "www.youtube.com" ||
			parsed.hostname === "youtube.com" ||
			parsed.hostname === "youtu.be"
		) {
			let videoId: string | null = null;
			if (parsed.hostname === "youtu.be") {
				videoId = parsed.pathname.slice(1);
			} else {
				videoId = parsed.searchParams.get("v");
			}

			if (videoId) {
				return {
					ok: true,
					provider: "YOUTUBE",
					sourceId: videoId,
					url: trimmed,
				};
			}
		}

		// 3. Vimeo
		if (parsed.hostname.includes("vimeo.com")) {
			const parts = parsed.pathname.split("/").filter(Boolean);
			const videoId = parts[0];
			if (videoId && /^\d+$/.test(videoId)) {
				return {
					ok: true,
					provider: "VIMEO",
					sourceId: videoId,
					url: trimmed,
				};
			}
		}

		// 4. Custom MP4 Direct
		if (parsed.pathname.endsWith(".mp4")) {
			return {
				ok: true,
				provider: "CUSTOM_MP4",
				url: trimmed,
			};
		}

		// 5. HLS Direct
		if (parsed.pathname.endsWith(".m3u8")) {
			return {
				ok: true,
				provider: "HLS",
				url: trimmed,
			};
		}

		return {
			ok: false,
			error: "Unsupported video host. Supported: Bunny.net, YouTube, Vimeo, direct MP4/HLS.",
		};
	} catch {
		return { ok: false, error: "Invalid URL format." };
	}
}
