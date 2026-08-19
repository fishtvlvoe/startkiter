"use client";

import { useState, type ReactNode } from "react";

import { TeacherAvatar } from "./TeacherAvatar";

export type DialoguePrompt = {
	question: ReactNode;
	response: ReactNode;
};

export type DialogueWindowProps = {
	prompts: readonly DialoguePrompt[];
	avatar?: boolean;
	initialIndex?: number;
	onPromptSelect?: (prompt: DialoguePrompt, index: number) => void;
	className?: string;
};

export function DialogueWindow({
	prompts,
	avatar = false,
	initialIndex,
	onPromptSelect,
	className,
}: DialogueWindowProps) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(
		initialIndex !== undefined && prompts[initialIndex] ? initialIndex : null,
	);
	const selectedPrompt = selectedIndex === null ? undefined : prompts[selectedIndex];

	const selectPrompt = (index: number) => {
		const prompt = prompts[index];
		if (!prompt) {
			return;
		}
		setSelectedIndex(index);
		onPromptSelect?.(prompt, index);
	};

	return (
		<section
			aria-label="對話問答"
			className={"interactive-block interactive-dialogue " + (className ?? "")}
			data-component="dialogue-window"
		>
			{avatar ? <TeacherAvatar caption="選一個問題開始對話" mood="explaining" /> : null}
			<div data-slot="prompts" role="list">
				{prompts.map((prompt, index) => (
					<button
						aria-pressed={selectedIndex === index}
						data-prompt-index={index}
						key={index}
						onClick={() => selectPrompt(index)}
						type="button"
					>
						{prompt.question}
					</button>
				))}
			</div>
			{selectedPrompt ? (
				<div aria-live="polite" data-response-index={selectedIndex} data-slot="response">
					<p data-speaker="learner">{selectedPrompt.question}</p>
					<p data-speaker="teacher">{selectedPrompt.response}</p>
				</div>
			) : (
				<p data-slot="empty-state">點選問題查看講師回覆</p>
			)}
		</section>
	);
}
