"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";

export type TeacherMood = "explaining" | "encouraging" | "thinking";

export type TeacherAvatarProps = {
	mood: TeacherMood;
	caption: ReactNode;
	at?: string | number;
	onSpeak?: () => void;
	className?: string;
};

function ExplainingIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
			<circle cx="12" cy="8" r="3" strokeWidth={1.8} />
			<path strokeWidth={1.8} strokeLinecap="round" d="M6 19c.8-3 3-4.5 6-4.5s5.2 1.5 6 4.5" />
			<path strokeWidth={1.8} strokeLinecap="round" d="M16 5.5l1.5-1.5M18 8h2" />
		</svg>
	);
}

function EncouragingIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
			<circle cx="12" cy="12" r="9" strokeWidth={1.8} />
			<circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
			<circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
			<path strokeWidth={1.8} strokeLinecap="round" d="M8.5 14.5c1.2 1.5 2.7 2.2 3.5 2.2s2.3-.7 3.5-2.2" />
		</svg>
	);
}

function ThinkingIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
			<circle cx="12" cy="12" r="9" strokeWidth={1.8} />
			<circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
			<circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
			<circle cx="12" cy="16" r="1.2" fill="currentColor" stroke="none" />
		</svg>
	);
}

function SpeakerIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
			<path
				strokeWidth={1.8}
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M11 5L6 9H3v6h3l5 4V5zM16 9a4 4 0 010 6M18.5 7a7 7 0 010 10"
			/>
		</svg>
	);
}

const moodIcon: Record<TeacherMood, ComponentType<SVGProps<SVGSVGElement>>> = {
	encouraging: EncouragingIcon,
	explaining: ExplainingIcon,
	thinking: ThinkingIcon,
};

export function TeacherAvatar({
	mood,
	caption,
	at,
	onSpeak,
	className,
}: TeacherAvatarProps) {
	const MoodIcon = moodIcon[mood];

	return (
		<aside
			aria-label="講師提示"
			className={"interactive-block interactive-teacher " + (className ?? "")}
			data-at={at}
			data-component="teacher-avatar"
			data-mood={mood}
		>
			<div aria-label={"講師狀態：" + mood} role="img">
				<MoodIcon className="h-10 w-10" />
			</div>
			<div data-slot="speech-bubble">
				<mark>{caption}</mark>
				<button
					aria-label="播放語音提示"
					data-action="speak"
					disabled={!onSpeak}
					onClick={onSpeak}
					type="button"
				>
					<SpeakerIcon className="mr-1 inline h-4 w-4 align-text-bottom" />
					播放
				</button>
			</div>
		</aside>
	);
}
