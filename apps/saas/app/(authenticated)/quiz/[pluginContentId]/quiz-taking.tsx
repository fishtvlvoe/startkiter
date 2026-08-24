"use client";

import type { LearnerQuiz } from "@startkiter/course-quiz";
import { Button, Card, Input, Label } from "@startkiter/ui";
import { orpcClient } from "@shared/lib/orpc-client";
import { useState } from "react";

type QuizResult = {
	score: number;
	passed: boolean;
	correctQuestionIds?: string[];
	correctAnswers?: Record<string, string | string[] | boolean>;
};

export function QuizTaking({ quiz }: { quiz: LearnerQuiz }) {
	const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>({});
	const [result, setResult] = useState<QuizResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [startedAt] = useState(() => new Date().toISOString());

	function setAnswer(questionId: string, answer: string | string[] | boolean) {
		setAnswers((current) => ({ ...current, [questionId]: answer }));
	}

	function toggleMultipleChoice(questionId: string, optionId: string, checked: boolean) {
		const current = Array.isArray(answers[questionId]) ? answers[questionId] : [];
		setAnswer(
			questionId,
			checked ? [...current, optionId] : current.filter((value) => value !== optionId),
		);
	}

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const submitted = await orpcClient.quiz.submit({
				pluginContentId: quiz.id,
				answers,
				startedAt,
			});
			setResult(submitted);
		} catch {
			setError("測驗送出失敗，請確認仍在測驗時間內。");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card className="mx-auto max-w-3xl p-6" data-testid="quiz-taking" data-quiz-id={quiz.id}>
			<div className="mb-6 space-y-2">
				<p className="text-sm text-muted-foreground">課後測驗</p>
				<h1 className="text-2xl font-bold">{quiz.title}</h1>
				<p className="text-sm text-muted-foreground">及格分數：{quiz.passingScore} 分</p>
			</div>

			{result ? (
				<section className="space-y-4" data-testid="quiz-result">
					<h2 className="text-xl font-semibold">測驗結果</h2>
					<p className={result.passed ? "text-green-600" : "text-orange-600"}>
						{result.passed ? "已通過" : "尚未通過"}，得分 {result.score} 分
					</p>
					{result.correctAnswers ? (
						<p data-testid="quiz-answers-visible" className="text-sm text-muted-foreground">
							正確答案已顯示。
						</p>
					) : (
						<p data-testid="quiz-answers-hidden" className="text-sm text-muted-foreground">
							本測驗不顯示正確答案。
						</p>
					)}
				</section>
			) : (
				<form className="space-y-8" onSubmit={submit} aria-label="quiz-answer-form">
					{quiz.questions.map((question, index) => (
						<fieldset key={question.id} className="space-y-3 rounded-2xl border p-4">
							<legend className="px-1 font-medium">
								第 {index + 1} 題：{question.content}
							</legend>
							{question.type === "SINGLE_CHOICE" &&
								question.options?.map((option) => (
									<label key={option.id} className="flex items-center gap-2 text-sm">
										<input
											type="radio"
											name={question.id}
											value={option.id}
											onChange={() => setAnswer(question.id, option.id)}
										/>
										{option.text}
									</label>
								))}
							{question.type === "MULTIPLE_CHOICE" &&
								question.options?.map((option) => (
									<label key={option.id} className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											value={option.id}
											onChange={(event) => toggleMultipleChoice(question.id, option.id, event.target.checked)}
										/>
										{option.text}
									</label>
								))}
							{question.type === "TRUE_FALSE" && (
								<label className="grid gap-1 text-sm">
									<span>答案</span>
									<select
										aria-label={`第 ${index + 1} 題答案`}
										className="h-9 rounded-xl border bg-card px-3"
										defaultValue=""
										onChange={(event) => setAnswer(question.id, event.target.value === "true")}
									>
										<option value="" disabled>
											請選擇
										</option>
										<option value="true">是</option>
										<option value="false">否</option>
									</select>
								</label>
							)}
							{question.type === "FILL_IN_BLANK" && (
								<label className="grid gap-1 text-sm">
									<span>答案</span>
									<Input
										aria-label={`第 ${index + 1} 題答案`}
										onChange={(event) => setAnswer(question.id, event.target.value)}
									/>
								</label>
							)}
						</fieldset>
					))}

					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
						送出測驗
					</Button>
				</form>
			)}
		</Card>
	);
}
