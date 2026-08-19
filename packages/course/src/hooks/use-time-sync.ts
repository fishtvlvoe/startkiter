"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";

import { parseTimecode, type Timecode, validateTimelineRange } from "../../timecode";

export type { Timecode } from "../../timecode";
export { parseTimecode } from "../../timecode";

export type TimeSyncOptions = {
	currentTime: number;
	at: Timecode;
	end?: Timecode;
	autoScroll?: boolean;
	scrollBehavior?: ScrollBehavior;
	elementRef?: RefObject<HTMLElement | null>;
	onActiveChange?: (isActive: boolean) => void;
};

export type TimeSyncState = {
	isActive: boolean;
	startSeconds: number;
	endSeconds?: number;
	ref: RefObject<HTMLElement | null>;
};

/**
 * A block is active from its start (inclusive) until its end (exclusive).
 * Using an exclusive end keeps adjacent timeline blocks from being active at once.
 */
export function isTimeActive(currentTime: number, at: Timecode, end?: Timecode): boolean {
	if (!Number.isFinite(currentTime)) {
		return false;
	}

	const startSeconds = parseTimecode(at);
	if (currentTime < startSeconds) {
		return false;
	}
	if (end === undefined) {
		return true;
	}

	const { endSeconds } = validateTimelineRange({ at: startSeconds, end });
	return currentTime < endSeconds!;
}

export function useTimeSync(options: TimeSyncOptions): TimeSyncState {
	const internalRef = useRef<HTMLElement | null>(null);
	const elementRef = options.elementRef ?? internalRef;
	const startSeconds = useMemo(() => parseTimecode(options.at), [options.at]);
	const endSeconds = useMemo(
		() => validateTimelineRange({ at: startSeconds, end: options.end }).endSeconds,
		[options.end, startSeconds],
	);
	const isActive = isTimeActive(options.currentTime, startSeconds, endSeconds);
	const previousActive = useRef(false);

	useEffect(() => {
		const justActivated = isActive && !previousActive.current;

		if (isActive !== previousActive.current) {
			options.onActiveChange?.(isActive);
		}
		const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
		if (justActivated && options.autoScroll !== false && !reducedMotion) {
			elementRef.current?.scrollIntoView?.({
				behavior: options.scrollBehavior ?? "smooth",
				block: "center",
			});
		}

		previousActive.current = isActive;
	}, [
		elementRef,
		isActive,
		options.autoScroll,
		options.onActiveChange,
		options.scrollBehavior,
	]);

	return { isActive, startSeconds, endSeconds, ref: elementRef };
}
