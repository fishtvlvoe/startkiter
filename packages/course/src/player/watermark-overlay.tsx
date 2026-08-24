"use client";

import { useEffect, useMemo, useState } from "react";

export type WatermarkOverlayProps = {
	email: string;
	courseTitle: string;
	enabled: boolean;
	showEmail: boolean;
	showCourseTitle: boolean;
	showTimestamp: boolean;
	emailDisplayMode: "FULL" | "MASKED";
	opacityPercent: number;
	textSize: "SM" | "MD" | "LG";
	movementMode: "STANDARD" | "CORNERS";
	moveIntervalSec: number;
};

export type WatermarkPlayerSettings = WatermarkOverlayProps & {
	tamperPauseEnabled: boolean;
};

const STANDARD_POSITIONS = [
	{ left: "18%", top: "18%", transform: "translate(-18%, -18%)" },
	{ left: "82%", top: "24%", transform: "translate(-82%, -24%)" },
	{ left: "68%", top: "78%", transform: "translate(-68%, -78%)" },
	{ left: "24%", top: "72%", transform: "translate(-24%, -72%)" },
] as const;

const CORNER_POSITIONS = [
	{ left: "12%", top: "12%", transform: "translate(-12%, -12%)" },
	{ left: "88%", top: "12%", transform: "translate(-88%, -12%)" },
	{ left: "88%", top: "88%", transform: "translate(-88%, -88%)" },
	{ left: "12%", top: "88%", transform: "translate(-12%, -88%)" },
] as const;

const TEXT_SIZE_PX = {
	SM: "0.7rem",
	MD: "0.85rem",
	LG: "1rem",
} as const;

export function maskEmail(email: string): string {
	const [localPart, domainPart] = email.split("@", 2);
	if (!domainPart) {
		return localPart.length > 1 ? `${localPart[0]}***` : "***";
	}

	return `${localPart.charAt(0) || "*"}***@${domainPart}`;
}

export function WatermarkOverlay({
	email,
	courseTitle,
	enabled,
	showEmail,
	showCourseTitle,
	showTimestamp,
	emailDisplayMode,
	opacityPercent,
	textSize,
	movementMode,
	moveIntervalSec,
}: WatermarkOverlayProps) {
	const [positionIndex, setPositionIndex] = useState(0);

	const positions = movementMode === "CORNERS" ? CORNER_POSITIONS : STANDARD_POSITIONS;
	const intervalMs = Math.max(1, moveIntervalSec) * 1000;

	useEffect(() => {
		if (!enabled || positions.length < 2) return;

		const timer = window.setInterval(() => {
			setPositionIndex((current) => (current + 1) % positions.length);
		}, intervalMs);

		return () => window.clearInterval(timer);
	}, [enabled, intervalMs, positions.length]);

	const lines = useMemo(() => {
		const nextLines: string[] = [];
		if (showEmail && email.trim()) {
			nextLines.push(emailDisplayMode === "MASKED" ? maskEmail(email) : email);
		}
		if (showCourseTitle && courseTitle.trim()) nextLines.push(courseTitle);
		if (showTimestamp) nextLines.push(new Date().toLocaleString("zh-TW"));
		return nextLines;
	}, [courseTitle, email, emailDisplayMode, showCourseTitle, showEmail, showTimestamp]);

	if (!enabled || lines.length === 0) return null;

	const position = positions[positionIndex % positions.length];
	const clampedOpacity = Math.min(100, Math.max(1, opacityPercent)) / 100;

	return (
		<div
			aria-hidden="true"
			data-testid="watermark-overlay"
			style={{
				left: position.left,
				top: position.top,
				transform: position.transform,
				opacity: clampedOpacity,
				fontSize: TEXT_SIZE_PX[textSize],
			}}
			className="pointer-events-none absolute z-20 select-none whitespace-nowrap rounded border border-white/20 bg-black/20 px-2 py-1 font-mono text-white shadow-sm backdrop-blur-[1px]"
		>
			{lines.map((line) => (
				<div key={line}>{line}</div>
			))}
		</div>
	);
}
