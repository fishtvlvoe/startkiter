"use client";

import type { ReactNode } from "react";

export type TeacherMood = "explaining" | "encouraging" | "thinking";

export type TeacherAvatarProps = {
	mood: TeacherMood;
	caption: ReactNode;
	at?: string | number;
	onSpeak?: () => void;
	className?: string;
};

const moodLabel: Record<TeacherMood, string> = {
	encouraging: "鼓勵",
	explaining: "解說",
	thinking: "思考",
};

export function TeacherAvatar({
	mood,
	caption,
	at,
	onSpeak,
	className,
}: TeacherAvatarProps) {
	return (
		<aside
			aria-label="講師提示"
			className={"interactive-block interactive-teacher " + (className ?? "")}
			data-at={at}
			data-component="teacher-avatar"
			data-mood={mood}
		>
			<div aria-label={"講師狀態：" + moodLabel[mood]} role="img">
				<svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
					<circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
					<path d="M5 21c.7-4.1 3-6.2 7-6.2s6.3 2.1 7 6.2" stroke="currentColor" strokeWidth="1.5" />
					<path d="M4 5.5h16" stroke="currentColor" strokeWidth="1.5" />
				</svg>
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
					<span aria-hidden="true">
						<svg fill="none" viewBox="0 0 24 24">
							<path d="M4 10v4h4l5 4V6L8 10H4Z" stroke="currentColor" strokeWidth="1.5" />
							<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.5" />
						</svg>
					</span>
					播放
				</button>
			</div>
		</aside>
	);
}
