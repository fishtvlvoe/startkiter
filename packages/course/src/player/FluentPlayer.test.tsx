// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FluentPlayer } from "./FluentPlayer";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type RenderHarness = {
	container: HTMLDivElement;
	root: Root;
	render: (element: ReactElement) => Promise<void>;
};

const activeRoots = new Set<Root>();

async function createRenderHarness(): Promise<RenderHarness> {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	activeRoots.add(root);

	return {
		container,
		root,
		render: async (element) => {
			await act(async () => root.render(element));
		},
	};
}

function playerElement(onWatchTime: (watchedSec: number) => void, watchKey = "lesson-1") {
	return (
		<FluentPlayer
			onWatchTime={onWatchTime}
			resolved={{ ok: true, provider: "CUSTOM_MP4", url: "https://cdn.example.test/lesson.mp4" }}
			title="測試影片"
			watchKey={watchKey}
		/>
	);
}

function setVideoState(video: HTMLVideoElement, currentTime: number, paused: boolean) {
	Object.defineProperty(video, "currentTime", { configurable: true, value: currentTime });
	Object.defineProperty(video, "paused", { configurable: true, value: paused });
}

afterEach(() => {
	for (const root of activeRoots) root.unmount();
	activeRoots.clear();
	document.body.replaceChildren();
	vi.useRealTimers();
});

describe("FluentPlayer watch-time reporting", () => {
	it("flushes a short watch session when the learner pauses", async () => {
		vi.useFakeTimers();
		const report = vi.fn();
		const harness = await createRenderHarness();
		await harness.render(playerElement(report));

		const video = harness.container.querySelector("video") as HTMLVideoElement;
		setVideoState(video, 20, true);
		await act(async () => video.dispatchEvent(new Event("pause")));

		expect(report).toHaveBeenCalledWith(20);
	});

	it("flushes the latest position on unmount and resets when the lesson changes", async () => {
		vi.useFakeTimers();
		const report = vi.fn();
		const harness = await createRenderHarness();
		await harness.render(playerElement(report, "lesson-1"));

		let video = harness.container.querySelector("video") as HTMLVideoElement;
		setVideoState(video, 45, false);
		await act(async () => {
			vi.advanceTimersByTime(30_000);
		});
		expect(report).toHaveBeenLastCalledWith(45);

		await harness.render(playerElement(report, "lesson-2"));
		video = harness.container.querySelector("video") as HTMLVideoElement;
		setVideoState(video, 30, false);
		await act(async () => {
			vi.advanceTimersByTime(30_000);
		});

		expect(report).toHaveBeenLastCalledWith(30);
	});

	it("receives time updates from an embedded provider and flushes on pause", async () => {
		const report = vi.fn();
		const harness = await createRenderHarness();
		await harness.render(
			<FluentPlayer
				onWatchTime={report}
				resolved={{ ok: true, provider: "VIMEO", sourceId: "123", url: "https://vimeo.com/123" }}
				title="嵌入影片"
				watchKey="lesson-embedded"
			/>,
		);

		const iframe = harness.container.querySelector("iframe") as HTMLIFrameElement;
		await act(async () => {
			window.dispatchEvent(
				new MessageEvent("message", {
					data: JSON.stringify({ event: "timeupdate", data: { seconds: 42 } }),
					source: iframe.contentWindow,
				}),
			);
			window.dispatchEvent(
				new MessageEvent("message", {
					data: JSON.stringify({ event: "pause" }),
					source: iframe.contentWindow,
				}),
			);
		});

		expect(report).toHaveBeenCalledWith(42);
	});

	it("flushes YouTube numeric pause state", async () => {
		const report = vi.fn();
		const harness = await createRenderHarness();
		await harness.render(
			<FluentPlayer
				onWatchTime={report}
				resolved={{ ok: true, provider: "YOUTUBE", sourceId: "abc", url: "https://youtube.com/watch?v=abc" }}
				title="YouTube 影片"
				watchKey="lesson-youtube"
			/>,
		);

		const iframe = harness.container.querySelector("iframe") as HTMLIFrameElement;
		await act(async () => {
			window.dispatchEvent(
				new MessageEvent("message", {
					data: JSON.stringify({ event: "infoDelivery", info: { currentTime: 42, playerState: 1 } }),
					source: iframe.contentWindow,
				}),
			);
			window.dispatchEvent(
				new MessageEvent("message", {
					data: JSON.stringify({ event: "onStateChange", info: 2 }),
					source: iframe.contentWindow,
				}),
			);
		});

		expect(report).toHaveBeenCalledWith(42);
	});
});
