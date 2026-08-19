"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";

export type Timecode = number | string;

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
 * Converts seconds, mm:ss, or hh:mm:ss into seconds.
 */
export function parseTimecode(timecode: Timecode): number {
	if (typeof timecode === "number") {
		if (!Number.isFinite(timecode) || timecode < 0) {
			throw new Error("Invalid timecode: " + String(timecode));
		}
		return timecode;
	}

	const value = timecode.trim();
	if (!value) {
		throw new Error("Invalid timecode: empty value");
	}

	const parts = value.split(":").map(Number);
	if (
		parts.length > 3 ||
		parts.some((part) => !Number.isFinite(part) || part < 0) ||
		(parts.length > 1 && (parts[parts.length - 1] ?? 0) >= 60) ||
		(parts.length > 2 && (parts[parts.length - 2] ?? 0) >= 60)
	) {
		throw new Error("Invalid timecode: " + timecode);
	}

	if (parts.length === 1) {
		return parts[0] ?? 0;
	}
	if (parts.length === 2) {
		return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
	}
	return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
}

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

	const endSeconds = parseTimecode(end);
	if (endSeconds < startSeconds) {
		throw new Error("Timeline end must be greater than or equal to its start");
	}
	return currentTime < endSeconds;
}

export function useTimeSync(options: TimeSyncOptions): TimeSyncState {
	const internalRef = useRef<HTMLElement | null>(null);
	const elementRef = options.elementRef ?? internalRef;
	const startSeconds = useMemo(() => parseTimecode(options.at), [options.at]);
	const endSeconds = useMemo(
		() => (options.end === undefined ? undefined : parseTimecode(options.end)),
		[options.end],
	);
	const isActive = isTimeActive(options.currentTime, startSeconds, endSeconds);
	const previousActive = useRef(false);

	useEffect(() => {
		const justActivated = isActive && !previousActive.current;

		if (isActive !== previousActive.current) {
			options.onActiveChange?.(isActive);
		}
		if (justActivated && options.autoScroll !== false) {
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
