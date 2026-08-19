"use client";

import { useRef, type ReactNode } from "react";

import { useTimeSync, type Timecode } from "../../hooks/use-time-sync";

export type TimelineSyncProps = {
	at: Timecode;
	end?: Timecode;
	title?: ReactNode;
	currentTime?: number;
	autoScroll?: boolean;
	onActiveChange?: (isActive: boolean) => void;
	onSeek?: (seconds: number) => void;
	children?: ReactNode;
	className?: string;
};

export function TimelineSync({
	at,
	end,
	title,
	currentTime = Number.NaN,
	autoScroll = true,
	onActiveChange,
	onSeek,
	children,
	className,
}: TimelineSyncProps) {
	const blockRef = useRef<HTMLElement | null>(null);
	const sync = useTimeSync({
		at,
		autoScroll,
		currentTime,
		elementRef: blockRef,
		end,
		onActiveChange,
	});

	return (
		<section
			aria-current={sync.isActive ? "step" : undefined}
			className={
				"interactive-block interactive-timeline " +
				(sync.isActive ? "is-active " : "") +
				(className ?? "")
			}
			data-active={String(sync.isActive)}
			data-component="timeline-sync"
			data-end={sync.endSeconds}
			data-start={sync.startSeconds}
			ref={blockRef}
		>
			{title ? (
				<button
					aria-label={"跳到時間碼 " + sync.startSeconds + " 秒"}
					onClick={() => onSeek?.(sync.startSeconds)}
					type="button"
				>
					{title}
				</button>
			) : null}
			<div>{children}</div>
		</section>
	);
}
