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

const moodEmoji: Record<TeacherMood, string> = {
	encouraging: "😊",
	explaining: "🧑‍🏫",
	thinking: "🤔",
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
			<div aria-label={"講師狀態：" + mood} role="img">
				{moodEmoji[mood]}
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
					🔊 播放
				</button>
			</div>
		</aside>
	);
}
