"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { WatermarkOverlay, type WatermarkPlayerSettings } from "./watermark-overlay";

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


function PlayerFrame({ children, watermark }: { children: ReactNode; watermark?: WatermarkPlayerSettings }) {
	const frameRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!watermark?.enabled || !watermark.tamperPauseEnabled) return;

		const pauseEmbeddedPlayers = () => {
			frameRef.current?.querySelectorAll<HTMLIFrameElement>("iframe").forEach((iframe) => {
				if (!iframe.contentWindow) return;

				try {
					const origin = new URL(iframe.src, window.location.href).origin;
					const src = iframe.src.toLowerCase();

					if (src.includes("youtube.com")) {
						iframe.contentWindow.postMessage(
							JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
							origin,
						);
					} else if (src.includes("vimeo.com") || src.includes("mediadelivery.net")) {
						// Vimeo and Bunny Stream both implement the player.js iframe protocol.
						iframe.contentWindow.postMessage(JSON.stringify({ method: "pause" }), origin);
					}
				} catch {
					// A malformed or detached iframe must not break native-video pausing.
				}
			});
		};
		const pausePlayers = () => {
			frameRef.current?.querySelectorAll("video").forEach((video) => video.pause());
			pauseEmbeddedPlayers();
		};
		const pauseWhenHidden = () => {
			if (document.visibilityState === "hidden") pausePlayers();
		};

		document.addEventListener("visibilitychange", pauseWhenHidden);
		window.addEventListener("blur", pausePlayers);
		return () => {
			document.removeEventListener("visibilitychange", pauseWhenHidden);
			window.removeEventListener("blur", pausePlayers);
		};
	}, [watermark?.enabled, watermark?.tamperPauseEnabled]);

	const toggleFullscreen = () => {
		const frame = frameRef.current;
		if (!frame) return;
		if (document.fullscreenElement === frame) {
			void document.exitFullscreen?.();
			return;
		}
		const requestFullscreen = frame.requestFullscreen;
		if (requestFullscreen) void requestFullscreen.call(frame).catch(() => undefined);
	};

	return (
		<div ref={frameRef} className="relative h-full w-full bg-black" data-testid="player-frame">
			{children}
			{watermark ? <WatermarkOverlay {...watermark} /> : null}
			{watermark?.enabled ? (
				<button
					aria-label="影片全螢幕"
					className="absolute right-3 top-3 z-30 rounded bg-black/70 px-2 py-1 text-xs text-white"
					onClick={toggleFullscreen}
					type="button"
				>
					全螢幕
				</button>
			) : null}
		</div>
	);
}

export function FluentPlayer({
	title,
	resolved,
	watermark,
}: {
	title: string;
	resolved: FluentPlayerSource | null;
	watermark?: WatermarkPlayerSettings;
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
			<PlayerFrame watermark={watermark}>
				<iframe
					className="h-full w-full"
					src={`https://www.youtube.com/embed/${encodeURIComponent(resolved.sourceId)}?autoplay=0&enablejsapi=1`}
					title={title}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen={!watermark?.enabled}
				/>
			</PlayerFrame>
		);
	}

	if (resolved.provider === "VIMEO" && resolved.sourceId) {
		return (
			<PlayerFrame watermark={watermark}>
				<iframe
					className="h-full w-full"
					src={`https://player.vimeo.com/video/${encodeURIComponent(resolved.sourceId)}?api=1`}
					title={title}
					allow="autoplay; fullscreen; picture-in-picture"
					allowFullScreen={!watermark?.enabled}
				/>
			</PlayerFrame>
		);
	}

	if (resolved.provider === "BUNNY") {
		return (
			<PlayerFrame watermark={watermark}>
				<iframe
					className="h-full w-full"
					src={resolved.url}
					title={title}
					allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
					allowFullScreen={!watermark?.enabled}
				/>
			</PlayerFrame>
		);
	}

	if (resolved.provider === "CUSTOM_MP4") {
		return (
			<PlayerFrame watermark={watermark}>
				<video
					className="h-full w-full"
					controls
					controlsList={watermark?.enabled ? "nofullscreen" : undefined}
					playsInline
					src={resolved.url}
					title={title}
				>
					您的瀏覽器不支援 MP4 播放。
				</video>
			</PlayerFrame>
		);
	}

	if (resolved.provider === "HLS") {
		return (
			<PlayerFrame watermark={watermark}>
				<video
					className="h-full w-full"
					controls
					controlsList={watermark?.enabled ? "nofullscreen" : undefined}
					playsInline
					src={resolved.url}
					title={title}
				>
					您的瀏覽器不支援 HLS 播放。
				</video>
			</PlayerFrame>
		);
	}

	return (
		<div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
			這個影音來源無法嵌入。
		</div>
	);
}
