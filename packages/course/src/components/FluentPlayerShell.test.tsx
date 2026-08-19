// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FluentPlayerShell } from "./FluentPlayerShell";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

afterEach(() => {
	root?.unmount();
	container?.remove();
	root = null;
	container = null;
	vi.restoreAllMocks();
});

describe("FluentPlayerShell", () => {
	it("forwards a real video time event and seeks the same video element", async () => {
		const onDurationChange = vi.fn();
		const onTimeUpdate = vi.fn();
		let seek: ((seconds: number) => void) | undefined;
		vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);

		await act(async () => {
			root?.render(
				<FluentPlayerShell
					onDurationChange={onDurationChange}
					onSeekReady={(nextSeek) => {
						seek = nextSeek;
					}}
					onTimeUpdate={onTimeUpdate}
					source={{ provider: "CUSTOM_MP4", url: "https://media.example.test/lesson.mp4" }}
					title="測試單元"
				/>,
			);
		});

		const video = container.querySelector("video") as HTMLVideoElement;
		Object.defineProperty(video, "duration", { configurable: true, value: 120 });
		Object.defineProperty(video, "currentTime", { configurable: true, value: 42, writable: true });
		await act(async () => {
			video.dispatchEvent(new Event("loadedmetadata", { bubbles: true }));
			video.dispatchEvent(new Event("timeupdate", { bubbles: true }));
		});

		expect(onDurationChange).toHaveBeenCalledWith(120);
		expect(onTimeUpdate).toHaveBeenCalledWith(42);
		await act(async () => seek?.(90));
		expect(video.currentTime).toBe(90);
	});
});
