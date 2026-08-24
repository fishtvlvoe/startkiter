// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WatermarkOverlay, maskEmail } from "./watermark-overlay";

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

afterEach(() => {
	for (const root of activeRoots) root.unmount();
	activeRoots.clear();
	document.body.replaceChildren();
	vi.useRealTimers();
});

describe("WatermarkOverlay", () => {
	it("masks an email without exposing the full address", () => {
		const masked = maskEmail("fish@example.com");

		expect(masked).toBe("f***@example.com");
		expect(masked).not.toContain("fish@example.com");
	});

	it("renders enabled content and moves on a timer", async () => {
		vi.useFakeTimers();
		const harness = await createRenderHarness();

		await harness.render(
			<WatermarkOverlay
				email="fish@example.com"
				courseTitle="開站包"
				enabled
				showEmail
				showCourseTitle
				showTimestamp={false}
				emailDisplayMode="MASKED"
				opacityPercent={18}
				textSize="MD"
				movementMode="STANDARD"
				moveIntervalSec={5}
			/>,
		);

		const overlay = harness.container.querySelector<HTMLElement>("[data-testid=watermark-overlay]");
		expect(overlay).not.toBeNull();
		expect(overlay?.textContent).toContain("f***@example.com");
		expect(overlay?.textContent).toContain("開站包");
		const firstPosition = overlay?.style.transform;

		await act(async () => {
			vi.advanceTimersByTime(5000);
		});

		expect(overlay?.style.transform).not.toBe(firstPosition);
	});

	it("renders nothing when disabled and clears its timer on unmount", async () => {
		vi.useFakeTimers();
		const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
		const harness = await createRenderHarness();

		await harness.render(
			<WatermarkOverlay
				email="fish@example.com"
				courseTitle="開站包"
				enabled
				showEmail
				showCourseTitle
				showTimestamp
				emailDisplayMode="FULL"
				opacityPercent={18}
				textSize="MD"
				movementMode="STANDARD"
				moveIntervalSec={5}
			/>,
		);

		await harness.render(
			<WatermarkOverlay
				email="fish@example.com"
				courseTitle="開站包"
				enabled={false}
				showEmail
				showCourseTitle
				showTimestamp
				emailDisplayMode="FULL"
				opacityPercent={18}
				textSize="MD"
				movementMode="STANDARD"
				moveIntervalSec={5}
			/>,
		);

		expect(harness.container.querySelector("[data-testid=watermark-overlay]")).toBeNull();
		harness.root.unmount();
		expect(clearIntervalSpy).toHaveBeenCalled();
	});
});
