"use client";

import type { QuizDefinitionBody } from "@startkiter/course-quiz";
import { Button, Card, Input, Label } from "@startkiter/ui";
import { orpcClient } from "@shared/lib/orpc-client";
import { useState } from "react";

type LessonOption = { id: string; title: string; chapterTitle: string; courseTitle: string };
type EditableQuestion = QuizDefinitionBody["questions"][number];
type QuestionType = EditableQuestion["type"];

function createQuestion(id: string, type: QuestionType = "SINGLE_CHOICE"): EditableQuestion {
	const common = { id, content: "", explanation: null, points: 1 };
	if (type === "MULTIPLE_CHOICE") {
		return { ...common, type, options: [{ id: "a", text: "選項 A" }, { id: "b", text: "選項 B" }, { id: "c", text: "選項 C" }], correctAnswer: ["a", "c"] };
	}
	if (type === "TRUE_FALSE") {
		return { ...common, type, options: [{ id: "true", text: "是" }, { id: "false", text: "否" }], correctAnswer: true };
	}
	if (type === "FILL_IN_BLANK") {
		return { ...common, type, options: null, correctAnswer: ["StartKiter"] };
	}
	return { ...common, type, options: [{ id: "a", text: "選項 A" }, { id: "b", text: "選項 B" }], correctAnswer: "b" };
}

const initialQuestions: EditableQuestion[] = [
	createQuestion("q-single", "SINGLE_CHOICE"),
	createQuestion("q-multiple", "MULTIPLE_CHOICE"),
	createQuestion("q-true-false", "TRUE_FALSE"),
	createQuestion("q-fill", "FILL_IN_BLANK"),
];

export function QuizAdminForm({ lessons }: { lessons: LessonOption[] }) {
	const [title, setTitle] = useState("");
	const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
	const [passingScore, setPassingScore] = useState("60");
	const [timeLimitMinutes, setTimeLimitMinutes] = useState("");
	const [shuffleQuestions, setShuffleQuestions] = useState(false);
	const [shuffleOptions, setShuffleOptions] = useState(false);
	const [blockNextLesson, setBlockNextLesson] = useState(false);
	const [showAnswers, setShowAnswers] = useState<QuizDefinitionBody["showAnswers"]>("IMMEDIATELY");
	const [questions, setQuestions] = useState(initialQuestions);
	const [createdId, setCreatedId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function updateQuestion(index: number, updater: (question: EditableQuestion) => EditableQuestion) {
		setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? updater(question) : question));
	}

	function changeQuestionType(index: number, type: QuestionType) {
		updateQuestion(index, (question) => ({ ...createQuestion(question.id, type), content: question.content, points: question.points }));
	}

	function updateOptionText(index: number, optionId: string, text: string) {
		updateQuestion(index, (question) => {
			if (!("options" in question) || !question.options) return question;
			return { ...question, options: question.options.map((option) => option.id === optionId ? { ...option, text } : option) } as EditableQuestion;
		});
	}

	function toggleMultipleAnswer(index: number, optionId: string, checked: boolean) {
		updateQuestion(index, (question) => {
			if (question.type !== "MULTIPLE_CHOICE") return question;
			const correctAnswer = checked
				? [...question.correctAnswer, optionId]
				: question.correctAnswer.filter((answer) => answer !== optionId);
			return { ...question, correctAnswer: correctAnswer.length ? correctAnswer : [optionId] };
		});
	}

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const parsedTimeLimit = timeLimitMinutes.trim() ? Number(timeLimitMinutes) : null;
			if (parsedTimeLimit !== null && (!Number.isInteger(parsedTimeLimit) || parsedTimeLimit < 1)) {
				throw new Error("invalid time limit");
			}
			const created = await orpcClient.quiz.create({
				title,
				body: {
					lessonId,
					passingScore: Number(passingScore),
					timeLimitMinutes: parsedTimeLimit,
					shuffleQuestions,
					shuffleOptions,
					showAnswers,
					blockNextLesson,
					questions,
				},
			});
			setCreatedId(created.id);
		} catch {
			setError("建立測驗失敗，請確認單元、設定與題目內容完整。");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card className="max-w-4xl p-6" data-testid="quiz-admin-form">
			<div className="mb-6 space-y-2">
				<p className="text-sm text-muted-foreground">Plugin：quiz</p>
				<h1 className="text-2xl font-bold">建立課後測驗</h1>
				<p className="text-sm text-muted-foreground">測驗定義會儲存在共用 PluginContent，學員作答另存 QuizAttempt。</p>
			</div>

			{createdId ? (
				<div className="space-y-3" data-testid="quiz-created">
					<p className="text-green-600">測驗已建立：{createdId}</p>
					<a className="underline" href={`/quiz/${createdId}`}>開啟學員測驗頁</a>
				</div>
			) : (
				<form className="space-y-8" onSubmit={submit} aria-label="quiz-create-form">
					<div className="grid gap-4 md:grid-cols-2">
						<label className="grid gap-1 text-sm"><Label htmlFor="quiz-title">測驗名稱</Label><Input id="quiz-title" value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
						<label className="grid gap-1 text-sm"><Label htmlFor="quiz-lesson">綁定單元</Label><select id="quiz-lesson" className="h-9 rounded-xl border bg-card px-3" value={lessonId} onChange={(event) => setLessonId(event.target.value)} required>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.courseTitle} / {lesson.chapterTitle} / {lesson.title}</option>)}</select></label>
						<label className="grid gap-1 text-sm"><Label htmlFor="quiz-passing-score">及格分數</Label><Input id="quiz-passing-score" type="number" min="0" max="100" value={passingScore} onChange={(event) => setPassingScore(event.target.value)} required /></label>
						<label className="grid gap-1 text-sm"><Label htmlFor="quiz-time-limit">限時（分鐘，留白為不限時）</Label><Input id="quiz-time-limit" type="number" min="1" step="1" value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(event.target.value)} /></label>
						<label className="grid gap-1 text-sm"><Label htmlFor="quiz-show-answers">答案顯示</Label><select id="quiz-show-answers" className="h-9 rounded-xl border bg-card px-3" value={showAnswers} onChange={(event) => setShowAnswers(event.target.value as QuizDefinitionBody["showAnswers"])}><option value="IMMEDIATELY">立即顯示</option><option value="AFTER_PASS">通過後顯示</option><option value="NEVER">不顯示</option></select></label>
					</div>

					<div className="flex flex-wrap gap-4 text-sm">
						<label className="flex items-center gap-2"><input type="checkbox" checked={shuffleQuestions} onChange={(event) => setShuffleQuestions(event.target.checked)} />洗牌題目</label>
						<label className="flex items-center gap-2"><input type="checkbox" checked={shuffleOptions} onChange={(event) => setShuffleOptions(event.target.checked)} />洗牌選項</label>
						<label className="flex items-center gap-2"><input type="checkbox" checked={blockNextLesson} onChange={(event) => setBlockNextLesson(event.target.checked)} />保留給未來的下一單元限制</label>
					</div>

					<div className="space-y-4">
						<div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">題目</h2><Button type="button" variant="outline" onClick={() => setQuestions((current) => [...current, createQuestion(`q-${current.length + 1}`)])}>新增題目</Button></div>
						{questions.map((question, index) => (
							<section key={question.id} className="space-y-3 rounded-2xl border p-4">
								<div className="flex items-center justify-between gap-3"><h3 className="font-medium">第 {index + 1} 題</h3>{questions.length > 1 && <Button type="button" variant="ghost" onClick={() => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))}>刪除</Button>}</div>
								<div className="grid gap-4 md:grid-cols-2">
									<label className="grid gap-1 text-sm"><Label htmlFor={`quiz-question-type-${index}`}>題型</Label><select id={`quiz-question-type-${index}`} className="h-9 rounded-xl border bg-card px-3" value={question.type} onChange={(event) => changeQuestionType(index, event.target.value as QuestionType)}><option value="SINGLE_CHOICE">單選題</option><option value="MULTIPLE_CHOICE">多選題</option><option value="TRUE_FALSE">是非題</option><option value="FILL_IN_BLANK">填空題</option></select></label>
									<label className="grid gap-1 text-sm"><Label htmlFor={`quiz-question-points-${index}`}>分數</Label><Input id={`quiz-question-points-${index}`} type="number" min="1" value={question.points} onChange={(event) => updateQuestion(index, (current) => ({ ...current, points: Number(event.target.value) }))} required /></label>
								</div>
								<label className="grid gap-1 text-sm"><Label htmlFor={`quiz-question-${index}`}>題目內容</Label><Input id={`quiz-question-${index}`} value={question.content} onChange={(event) => updateQuestion(index, (current) => ({ ...current, content: event.target.value }))} required /></label>

								{(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") && question.options && <div className="space-y-2"><p className="text-sm font-medium">選項與正確答案</p>{question.options.map((option) => <div key={option.id} className="flex items-center gap-2"><input type={question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"} name={question.type === "SINGLE_CHOICE" ? `quiz-correct-${index}` : undefined} checked={question.correctAnswer.includes(option.id)} onChange={(event) => question.type === "SINGLE_CHOICE" ? updateQuestion(index, (current) => current.type === "SINGLE_CHOICE" ? { ...current, correctAnswer: option.id } : current) : toggleMultipleAnswer(index, option.id, event.target.checked)} /><Input value={option.text} onChange={(event) => updateOptionText(index, option.id, event.target.value)} required /></div>)}</div>}
								{question.type === "TRUE_FALSE" && <label className="grid gap-1 text-sm"><Label htmlFor={`quiz-true-false-${index}`}>正確答案</Label><select id={`quiz-true-false-${index}`} className="h-9 rounded-xl border bg-card px-3" value={String(question.correctAnswer)} onChange={(event) => updateQuestion(index, (current) => current.type === "TRUE_FALSE" ? { ...current, correctAnswer: event.target.value === "true" } : current)}><option value="true">是</option><option value="false">否</option></select></label>}
								{question.type === "FILL_IN_BLANK" && <label className="grid gap-1 text-sm"><Label htmlFor={`quiz-fill-answers-${index}`}>可接受答案（用逗號分隔）</Label><Input id={`quiz-fill-answers-${index}`} value={question.correctAnswer.join(", ")} onChange={(event) => updateQuestion(index, (current) => current.type === "FILL_IN_BLANK" ? { ...current, correctAnswer: event.target.value.split(",").map((answer) => answer.trim()).filter(Boolean) } : current)} required /></label>}
							</section>
						))}
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button type="submit" variant="primary" size="lg" loading={isSubmitting}>建立測驗</Button>
				</form>
			)}
		</Card>
	);
}
