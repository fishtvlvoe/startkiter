"use client";

import Hls from "hls.js";
import VimeoPlayer from "@vimeo/player";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type FluentVideoSource = {
	embedUrl?: string;
	provider: "BUNNY" | "YOUTUBE" | "VIMEO" | "CUSTOM_MP4" | "HLS";
	sourceId?: string;
	url: string;
};

type BunnyPlayer = {
	getDuration: (callback: (duration: number) => void) => void;
	off: (event: string, callback?: (data: unknown) => void) => void;
	on: (event: string, callback: (data: unknown) => void) => void;
	setCurrentTime: (seconds: number) => void;
};

declare global {
	interface Window {
		playerjs?: {
			Player: new (iframe: HTMLIFrameElement) => BunnyPlayer;
		};
	}
}

export type FluentPlayerShellProps = {
	onDurationChange?: (seconds: number) => void;
	onSeekReady?: (seek: (seconds: number) => void) => void;
	onTimeUpdate?: (seconds: number) => void;
	source: FluentVideoSource | null;
	title: string;
};

const BUNNY_PLAYER_SCRIPT = "https://assets.mediadelivery.net/playerjs/playerjs-latest.min.js";

function loadBunnyPlayerScript() {
	if (window.playerjs) {
		return Promise.resolve();
	}

	return new Promise<void>((resolve, reject) => {
		const existing = document.querySelector<HTMLScriptElement>(
			'script[data-startkiter-bunny-player="true"]',
		);
		if (existing) {
			existing.addEventListener("load", () => resolve(), { once: true });
			existing.addEventListener("error", () => reject(new Error("Bunny Player.js failed to load.")), {
				once: true,
			});
			return;
		}

		const script = document.createElement("script");
		script.async = true;
		script.dataset.startkiterBunnyPlayer = "true";
		script.src = BUNNY_PLAYER_SCRIPT;
		script.addEventListener("load", () => resolve(), { once: true });
		script.addEventListener("error", () => reject(new Error("Bunny Player.js failed to load.")), {
			once: true,
		});
		document.head.append(script);
	});
}

function asSeconds(value: unknown) {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string") {
		try {
			return asSeconds(JSON.parse(value));
		} catch {
			return Number.NaN;
		}
	}
	if (typeof value === "object" && value !== null && "seconds" in value) {
		return asSeconds((value as { seconds?: unknown }).seconds);
	}
	return Number.NaN;
}

function youtubeOrigin() {
	return "https://www.youtube-nocookie.com";
}

export function FluentPlayerShell({
	onDurationChange,
	onSeekReady,
	onTimeUpdate,
	source,
	title,
}: FluentPlayerShellProps) {
	const playerId = useId().replace(/:/g, "");
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const vimeoPlayerRef = useRef<VimeoPlayer | null>(null);
	const bunnyPlayerRef = useRef<BunnyPlayer | null>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const publishTime = useCallback(
		(seconds: number) => {
			if (!Number.isFinite(seconds) || seconds < 0) {
				return;
			}
			setCurrentTime(seconds);
			onTimeUpdate?.(seconds);
		},
		[onTimeUpdate],
	);

	const publishDuration = useCallback(
		(seconds: number) => {
			if (!Number.isFinite(seconds) || seconds < 0) {
				return;
			}
			setDuration(seconds);
			onDurationChange?.(seconds);
		},
		[onDurationChange],
	);

	const seek = useCallback(
		(seconds: number) => {
			if (!source || !Number.isFinite(seconds) || seconds < 0) {
				return;
			}
			if (source.provider === "CUSTOM_MP4" || source.provider === "HLS") {
				if (videoRef.current) {
					videoRef.current.currentTime = seconds;
				}
			} else if (source.provider === "VIMEO") {
				void vimeoPlayerRef.current?.setCurrentTime(seconds);
			} else if (source.provider === "BUNNY") {
				bunnyPlayerRef.current?.setCurrentTime(seconds);
			} else {
				iframeRef.current?.contentWindow?.postMessage(
					JSON.stringify({
						event: "command",
						func: "seekTo",
						args: [seconds, true],
					}),
					youtubeOrigin(),
				);
			}
			publishTime(seconds);
		},
		[publishTime, source],
	);

	useEffect(() => {
		onSeekReady?.(seek);
	}, [onSeekReady, seek]);

	useEffect(() => {
		setCurrentTime(0);
		setDuration(null);
		setError(null);
	}, [source?.url]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !source || (source.provider !== "CUSTOM_MP4" && source.provider !== "HLS")) {
			return;
		}

		let hls: Hls | undefined;
		if (source.provider === "HLS" && Hls.isSupported()) {
			hls = new Hls();
			hls.loadSource(source.url);
			hls.attachMedia(video);
			hls.on(Hls.Events.ERROR, (_, data) => {
				if (data.fatal) {
					setError("HLS 串流目前無法播放。");
				}
			});
		} else {
			video.src = source.url;
		}

		return () => {
			hls?.destroy();
			video.removeAttribute("src");
			video.load();
		};
	}, [source]);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe || source?.provider !== "VIMEO") {
			return;
		}

		const player = new VimeoPlayer(iframe);
		vimeoPlayerRef.current = player;
		const onTimeUpdate = (event: { duration: number; seconds: number }) => {
			publishDuration(event.duration);
			publishTime(event.seconds);
		};
		const onPlayerDurationChange = (event: { duration: number }) => publishDuration(event.duration);
		player.on("timeupdate", onTimeUpdate);
		player.on("durationchange", onPlayerDurationChange);
		void player.ready().catch(() => setError("Vimeo 播放器無法初始化。"));

		return () => {
			player.off("timeupdate", onTimeUpdate);
			player.off("durationchange", onPlayerDurationChange);
			void player.destroy();
			vimeoPlayerRef.current = null;
		};
	}, [publishDuration, publishTime, source?.provider, source?.url]);

	useEffect(() => {
		const iframe = iframeRef.current;
		if (!iframe || source?.provider !== "BUNNY") {
			return;
		}

		let player: BunnyPlayer | null = null;
		let disposed = false;
		const onTimeUpdate = (value: unknown) => publishTime(asSeconds(value));
		void loadBunnyPlayerScript()
			.then(() => {
				if (disposed || !window.playerjs || !iframeRef.current) {
					return;
				}
				player = new window.playerjs.Player(iframeRef.current);
				bunnyPlayerRef.current = player;
				player.on("timeupdate", onTimeUpdate);
				player.on("ready", () => {
					player?.getDuration((seconds) => publishDuration(seconds));
				});
			})
			.catch(() => setError("Bunny 播放器無法初始化。"));

		return () => {
			disposed = true;
			player?.off("timeupdate", onTimeUpdate);
			bunnyPlayerRef.current = null;
		};
	}, [publishDuration, publishTime, source?.provider, source?.url]);

	useEffect(() => {
		if (source?.provider !== "YOUTUBE") {
			return;
		}

		const requestYouTubeState = () => {
			iframeRef.current?.contentWindow?.postMessage(
				JSON.stringify({ event: "command", func: "getCurrentTime", args: [] }),
				youtubeOrigin(),
			);
			iframeRef.current?.contentWindow?.postMessage(
				JSON.stringify({ event: "command", func: "getDuration", args: [] }),
				youtubeOrigin(),
			);
		};
		const onMessage = (event: MessageEvent<unknown>) => {
			if (event.origin !== youtubeOrigin()) {
				return;
			}
			const payload =
				typeof event.data === "string"
					? (() => {
							try {
								return JSON.parse(event.data) as Record<string, unknown>;
							} catch {
								return null;
							}
						})()
					: null;
			const info = payload?.info;
			if (typeof info === "object" && info !== null) {
				const record = info as Record<string, unknown>;
				publishTime(asSeconds(record.currentTime));
				const nextDuration = asSeconds(record.duration);
				if (Number.isFinite(nextDuration)) {
					publishDuration(nextDuration);
				}
			}
		};

		window.addEventListener("message", onMessage);
		const interval = window.setInterval(requestYouTubeState, 500);
		return () => {
			window.clearInterval(interval);
			window.removeEventListener("message", onMessage);
		};
	}, [publishDuration, publishTime, source?.provider]);

	const initializeYouTube = () => {
		if (source?.provider !== "YOUTUBE") {
			return;
		}
		iframeRef.current?.contentWindow?.postMessage(
			JSON.stringify({ event: "listening", id: playerId, channel: "widget" }),
			youtubeOrigin(),
		);
		iframeRef.current?.contentWindow?.postMessage(
			JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }),
			youtubeOrigin(),
		);
	};

	const isDirect = source?.provider === "CUSTOM_MP4" || source?.provider === "HLS";
	const iframeUrl =
		source?.provider === "BUNNY"
			? source.url + (source.url.includes("?") ? "&" : "?") + "playerInstance=" + playerId
			: source?.embedUrl;

	return (
		<section
			aria-label={title + " 播放器"}
			className="overflow-hidden rounded-lg bg-black"
			data-current-time={currentTime}
			data-duration={duration ?? undefined}
			data-provider={source?.provider}
		>
			<div className="relative aspect-video w-full">
				{!source ? (
					<div className="flex h-full items-center justify-center p-6 text-center text-sm text-neutral-300">
						此單元尚未設定可播放的影音來源。
					</div>
				) : isDirect ? (
					<video
						aria-label={title}
						className="h-full w-full"
						controls
						onError={() => setError("影片串流目前無法播放。")}
						onLoadedMetadata={(event) => publishDuration(event.currentTarget.duration)}
						onTimeUpdate={(event) => publishTime(event.currentTarget.currentTime)}
						playsInline
						ref={videoRef}
					/>
				) : (
					<iframe
						allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
						allowFullScreen
						className="h-full w-full border-0"
						onLoad={initializeYouTube}
						ref={iframeRef}
						src={iframeUrl}
						title={title}
					/>
				)}
			</div>
			{error ? <p className="border-t border-neutral-800 px-3 py-2 text-sm text-red-300">{error}</p> : null}
		</section>
	);
}
