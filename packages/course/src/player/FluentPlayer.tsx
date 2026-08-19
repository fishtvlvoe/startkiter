export type FluentPlayerSource =
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

export function FluentPlayer({
	title,
	resolved,
}: {
	title: string;
	resolved: FluentPlayerSource | null;
}) {
	if (!resolved || !resolved.ok) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400">
				<svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M14.752 11.168l-3.197-2.132A 1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p className="text-sm font-medium">
					{resolved && !resolved.ok ? resolved.error : "這個單元還沒有可播放的影音來源"}
				</p>
			</div>
		);
	}

	if (resolved.provider === "YOUTUBE" && resolved.sourceId) {
		return (
			<iframe
				className="h-full w-full"
				src={`https://www.youtube.com/embed/${encodeURIComponent(resolved.sourceId)}?autoplay=0`}
				title={title}
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
			/>
		);
	}

	if (resolved.provider === "VIMEO" && resolved.sourceId) {
		return (
			<iframe
				className="h-full w-full"
				src={`https://player.vimeo.com/video/${encodeURIComponent(resolved.sourceId)}`}
				title={title}
				allow="autoplay; fullscreen; picture-in-picture"
				allowFullScreen
			/>
		);
	}

	if (resolved.provider === "BUNNY") {
		return (
			<iframe
				className="h-full w-full"
				src={resolved.url}
				title={title}
				allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
				allowFullScreen
			/>
		);
	}

	if (resolved.provider === "CUSTOM_MP4") {
		return (
			<video className="h-full w-full" controls playsInline src={resolved.url} title={title}>
				您的瀏覽器不支援 MP4 播放。
			</video>
		);
	}

	if (resolved.provider === "HLS") {
		return (
			<video className="h-full w-full" controls playsInline src={resolved.url} title={title}>
				您的瀏覽器不支援 HLS 播放。
			</video>
		);
	}

	return (
		<div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
			這個影音來源無法嵌入。
		</div>
	);
}
