"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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

type WatchTimeReporter = (watchedSec: number) => void;
type EmbeddedProvider = "BUNNY" | "YOUTUBE" | "VIMEO";
type EmbeddedWatchMessage = Record<string, unknown>;

function asMessage(data: unknown): EmbeddedWatchMessage | null {
	if (typeof data !== "string") return null;

	try {
		const parsed: unknown = JSON.parse(data);
		return parsed && typeof parsed === "object" ? (parsed as EmbeddedWatchMessage) : null;
	} catch {
		return null;
	}
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function firstFiniteNumber(...values: unknown[]) {
	for (const value of values) {
		if (typeof value === "number" && Number.isFinite(value)) return value;
	}
	return null;
}

function embeddedEventName(message: EmbeddedWatchMessage) {
	return typeof message.event === "string"
		? message.event
		: typeof message.method === "string"
			? message.method
			: null;
}

function EmbeddedVideo({
	provider,
	src,
	title,
	onWatchTime,
	watchKey,
	allowFullScreen,
}: {
	provider: EmbeddedProvider;
	src: string;
	title: string;
	onWatchTime?: WatchTimeReporter;
	watchKey?: string;
	allowFullScreen: boolean;
}) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const lastReportedSecRef = useRef(0);
	const latestPositionSecRef = useRef(0);
	const isPlayingRef = useRef(false);

	useEffect(() => {
		lastReportedSecRef.current = 0;
		latestPositionSecRef.current = 0;
		isPlayingRef.current = false;
	}, [src, watchKey]);

	useEffect(() => {
		if (!onWatchTime) return;

		const report = (force: boolean) => {
			const watchedSec = Math.floor(latestPositionSecRef.current);
			if (!Number.isFinite(watchedSec) || watchedSec <= lastReportedSecRef.current) return;
			if (!force && (!isPlayingRef.current || watchedSec < lastReportedSecRef.current + 30)) return;

			lastReportedSecRef.current = watchedSec;
			onWatchTime(watchedSec);
		};

		const handleMessage = (event: MessageEvent) => {
			if (event.source !== iframeRef.current?.contentWindow) return;
			const message = asMessage(event.data);
			if (!message) return;

			const data = asRecord(message.data);
			const info = asRecord(message.info);
			const value = asRecord(message.value);
			const watchedSec = firstFiniteNumber(
				message.currentTime,
				data?.seconds,
				data?.currentTime,
				info?.currentTime,
				value?.seconds,
			);
			if (watchedSec !== null) latestPositionSecRef.current = watchedSec;

			const eventName = embeddedEventName(message);
			const playerState = firstFiniteNumber(message.info, info?.playerState);
			if ((eventName === "infoDelivery" || eventName === "onStateChange") && playerState !== null) {
				isPlayingRef.current = playerState === 1;
			}
			if (eventName === "play" || eventName === "playing" || eventName === "timeupdate") {
				isPlayingRef.current = true;
			}
			if (eventName === "pause" || eventName === "ended") {
				isPlayingRef.current = false;
				report(true);
			}
		};

		const interval = window.setInterval(() => report(false), 30_000);
		window.addEventListener("message", handleMessage);
		return () => {
			report(true);
			window.clearInterval(interval);
			window.removeEventListener("message", handleMessage);
		};
	}, [onWatchTime]);

	const subscribeToProviderEvents = () => {
		const iframe = iframeRef.current;
		if (!iframe?.contentWindow) return;

		try {
			const targetOrigin = new URL(src, window.location.href).origin;
			const post = (message: Record<string, unknown>) =>
				iframe.contentWindow?.postMessage(JSON.stringify(message), targetOrigin);

			if (provider === "YOUTUBE") {
				post({ event: "listening", id: "startkiter-watch-time", channel: "startkiter" });
				post({ event: "command", func: "addEventListener", args: ["onStateChange"] });
				return;
			}

			for (const eventName of ["timeupdate", "play", "pause", "ended"]) {
				post({ method: "addEventListener", value: eventName });
			}
		} catch {
			// 無效或已卸載的 iframe 不應讓課程播放器失效。
		}
	};

	return (
		<iframe
			ref={iframeRef}
			className="h-full w-full"
			onLoad={subscribeToProviderEvents}
			src={src}
			title={title}
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
			allowFullScreen={allowFullScreen}
		/>
	);
}

function NativeVideo({
	className,
	controlsList,
	src,
	title,
	onWatchTime,
	watchKey,
}: {
	className: string;
	controlsList?: string;
	src: string;
	title: string;
	onWatchTime?: WatchTimeReporter;
	watchKey?: string;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const lastReportedSecRef = useRef(0);

	useEffect(() => {
		lastReportedSecRef.current = 0;
	}, [src, watchKey]);

	useEffect(() => {
		if (!onWatchTime) return;

		const report = (force: boolean) => {
			const video = videoRef.current;
			if (!video || !Number.isFinite(video.currentTime)) return;

			const watchedSec = Math.floor(video.currentTime);
			if (watchedSec <= lastReportedSecRef.current) return;
			if (!force && (video.paused || watchedSec < lastReportedSecRef.current + 30)) return;

			lastReportedSecRef.current = watchedSec;
			onWatchTime(watchedSec);
		};

		const onPause = () => report(true);
		const onEnded = () => report(true);
		const video = videoRef.current;
		video?.addEventListener("pause", onPause);
		video?.addEventListener("ended", onEnded);
		const interval = window.setInterval(() => report(false), 30_000);
		return () => {
			report(true);
			window.clearInterval(interval);
			video?.removeEventListener("pause", onPause);
			video?.removeEventListener("ended", onEnded);
		};
	}, [onWatchTime]);

	return (
		<video
			ref={videoRef}
			className={className}
			controls
			controlsList={controlsList}
			playsInline
			src={src}
			title={title}
		>
			您的瀏覽器不支援影片播放。
		</video>
	);
}

function PlayerFrame({
	children,
	watermark,
}: {
	children: (usesManagedFullscreen: boolean) => ReactNode;
	watermark?: WatermarkPlayerSettings;
}) {
	const frameRef = useRef<HTMLDivElement>(null);
	const [fullscreenSupported, setFullscreenSupported] = useState(false);

	useEffect(() => {
		const frame = frameRef.current;
		setFullscreenSupported(Boolean(frame?.requestFullscreen) && document.fullscreenEnabled !== false);
	}, []);

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
		let blurTimer: ReturnType<typeof setTimeout> | undefined;
		const pauseWhenHidden = () => {
			if (document.visibilityState === "hidden") pausePlayers();
		};
		const pauseWhenWindowBlurs = () => {
			if (blurTimer !== undefined) clearTimeout(blurTimer);
			blurTimer = setTimeout(() => {
				blurTimer = undefined;
				const activeElement = document.activeElement;
				const focusRemainsInPlayer =
					document.hasFocus() && activeElement instanceof HTMLIFrameElement && frameRef.current?.contains(activeElement);
				if (!focusRemainsInPlayer) pausePlayers();
			}, 0);
		};

		document.addEventListener("visibilitychange", pauseWhenHidden);
		window.addEventListener("blur", pauseWhenWindowBlurs);
		return () => {
			document.removeEventListener("visibilitychange", pauseWhenHidden);
			window.removeEventListener("blur", pauseWhenWindowBlurs);
			if (blurTimer !== undefined) clearTimeout(blurTimer);
		};
	}, [watermark?.enabled, watermark?.tamperPauseEnabled]);
	const usesManagedFullscreen = Boolean(watermark?.enabled && fullscreenSupported);

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
			{children(usesManagedFullscreen)}
			{watermark ? <WatermarkOverlay {...watermark} /> : null}
			{usesManagedFullscreen ? (
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
	onWatchTime,
	watchKey,
}: {
	title: string;
	resolved: FluentPlayerSource | null;
	watermark?: WatermarkPlayerSettings;
	onWatchTime?: WatchTimeReporter;
	watchKey?: string;
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
		const sourceId = resolved.sourceId;
		return (
			<PlayerFrame watermark={watermark}>
				{(usesManagedFullscreen) => (
					<EmbeddedVideo
						provider="YOUTUBE"
						src={`https://www.youtube.com/embed/${encodeURIComponent(sourceId)}?autoplay=0&enablejsapi=1`}
						title={title}
						onWatchTime={onWatchTime}
						watchKey={watchKey}
						allowFullScreen={!usesManagedFullscreen}
					/>
				)}
			</PlayerFrame>
		);
	}

	if (resolved.provider === "VIMEO" && resolved.sourceId) {
		const sourceId = resolved.sourceId;
		return (
			<PlayerFrame watermark={watermark}>
				{(usesManagedFullscreen) => (
					<EmbeddedVideo
						provider="VIMEO"
						src={`https://player.vimeo.com/video/${encodeURIComponent(sourceId)}?api=1`}
						title={title}
						onWatchTime={onWatchTime}
						watchKey={watchKey}
						allowFullScreen={!usesManagedFullscreen}
					/>
				)}
			</PlayerFrame>
		);
	}

	if (resolved.provider === "BUNNY") {
		return (
			<PlayerFrame watermark={watermark}>
				{(usesManagedFullscreen) => (
					<EmbeddedVideo
						provider="BUNNY"
						src={resolved.url}
						title={title}
						onWatchTime={onWatchTime}
						watchKey={watchKey}
						allowFullScreen={!usesManagedFullscreen}
					/>
				)}
			</PlayerFrame>
		);
	}

	if (resolved.provider === "CUSTOM_MP4") {
		return (
			<PlayerFrame watermark={watermark}>
				{(usesManagedFullscreen) => (
					<NativeVideo
						key={`${resolved.provider}:${resolved.url}:${watchKey ?? ""}`}
						className="h-full w-full"
						controlsList={usesManagedFullscreen ? "nofullscreen" : undefined}
						src={resolved.url}
						title={title}
						onWatchTime={onWatchTime}
						watchKey={watchKey}
					/>
				)}
			</PlayerFrame>
		);
	}

	if (resolved.provider === "HLS") {
		return (
			<PlayerFrame watermark={watermark}>
				{(usesManagedFullscreen) => (
					<NativeVideo
						key={`${resolved.provider}:${resolved.url}:${watchKey ?? ""}`}
						className="h-full w-full"
						controlsList={usesManagedFullscreen ? "nofullscreen" : undefined}
						src={resolved.url}
						title={title}
						onWatchTime={onWatchTime}
						watchKey={watchKey}
					/>
				)}
			</PlayerFrame>
		);
	}

	return (
		<div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
			這個影音來源無法嵌入。
		</div>
	);
}
