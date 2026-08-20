"use client";

import { useMemo, useState, type ReactNode } from "react";

export type InstantQuizResult = {
	correct: boolean;
	selectedIndices: number[];
};

export type InstantQuizProps = {
	blockId: string;
	question: ReactNode;
	options: readonly ReactNode[];
	answerIndex: number | readonly number[];
	explanation: ReactNode;
	multiple?: boolean;
	onComplete?: (result: InstantQuizResult) => void;
	className?: string;
};

function sameAnswerSet(selectedIndices: readonly number[], correctIndices: readonly number[]) {
	if (selectedIndices.length !== correctIndices.length) {
		return false;
	}
	const correct = new Set(correctIndices);
	return selectedIndices.every((index) => correct.has(index));
}

export function InstantQuiz({
	blockId,
	question,
	options,
	answerIndex,
	explanation,
	multiple,
	onComplete,
	className,
}: InstantQuizProps) {
	const correctIndices = useMemo(
		() => (typeof answerIndex === "number" ? [answerIndex] : [...answerIndex]),
		[answerIndex],
	);
	const isMultiple = multiple ?? correctIndices.length > 1;
	const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
	const [result, setResult] = useState<InstantQuizResult | null>(null);
	const correctSet = useMemo(() => new Set(correctIndices), [correctIndices]);
	const selectedSet = useMemo(() => new Set(selectedIndices), [selectedIndices]);

	const submit = (nextSelectedIndices: number[]) => {
		const expectedIndices = isMultiple ? correctIndices : correctIndices.slice(0, 1);
		const nextResult = {
			correct: sameAnswerSet(nextSelectedIndices, expectedIndices),
			selectedIndices: nextSelectedIndices,
		};
		setSelectedIndices(nextSelectedIndices);
		setResult(nextResult);
		onComplete?.(nextResult);
	};

	const handleOptionClick = (index: number) => {
		if (result) {
			return;
		}
		if (!isMultiple) {
			submit([index]);
			return;
		}

		const nextSelectedIndices = selectedIndices.includes(index)
			? selectedIndices.filter((item) => item !== index)
			: [...selectedIndices, index];
		setSelectedIndices(nextSelectedIndices);
		if (
			nextSelectedIndices.some((item) => !correctSet.has(item)) ||
			nextSelectedIndices.length >= correctIndices.length
		) {
			submit(nextSelectedIndices);
		}
	};

	return (
		<section
			className={"interactive-block interactive-quiz " + (className ?? "")}
			data-block-id={blockId}
			data-component="instant-quiz"
			data-submitted={String(result !== null)}
		>
			<h3>{question}</h3>
			<div role="group" aria-label="測驗選項">
				{options.map((option, index) => {
					const isCorrectOption = result !== null && correctSet.has(index);
					const isIncorrectSelection =
						result !== null && selectedSet.has(index) && !isCorrectOption;
					const optionClassName = isCorrectOption
						? "interactive-option--correct"
						: isIncorrectSelection
							? "interactive-option--incorrect"
							: "";

					if (isMultiple) {
						return (
							<label
								className={"interactive-option " + optionClassName}
								data-option-index={index}
								key={index}
							>
								<input
									checked={selectedSet.has(index)}
									data-option-index={index}
									disabled={result !== null}
									name="instant-quiz-option"
									onChange={() => handleOptionClick(index)}
									type="checkbox"
								/>
								<span>{option}</span>
							</label>
						);
					}

					return (
						<button
							aria-pressed={selectedSet.has(index)}
							className={"interactive-option " + optionClassName}
							data-option-index={index}
							disabled={result !== null}
							key={index}
							onClick={() => handleOptionClick(index)}
							type="button"
						>
							{option}
						</button>
					);
				})}
			</div>

			{isMultiple && result === null ? (
				<button
					data-action="check-answer"
					disabled={selectedIndices.length === 0}
					onClick={() => submit(selectedIndices)}
					type="button"
				>
					檢查答案
				</button>
			) : null}

			{result ? (
				<div
					aria-live="polite"
					className={
						result.correct
							? "interactive-feedback--correct"
							: "interactive-feedback--incorrect"
					}
					data-result={result.correct ? "correct" : "incorrect"}
					role="status"
				>
					<strong>{result.correct ? "答對了" : "再想想"}</strong>
					<div>{explanation}</div>
				</div>
			) : null}
		</section>
	);
}
