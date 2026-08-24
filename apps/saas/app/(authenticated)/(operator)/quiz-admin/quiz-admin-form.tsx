"use client";

import type { QuizDefinitionBody } from "@startkiter/course-quiz";
import { Button, Card, Input, Label } from "@startkiter/ui";
import { orpcClient } from "@shared/lib/orpc-client";
import { useState } from "react";

type LessonOption = { id: string; title: string; chapterTitle: string; courseTitle: string };
type EditableQuestion = QuizDefinitionBody["questions"][number];

const initialQuestions: EditableQuestion[] = [
	{
		id: "q-single",
		type: "SINGLE_CHOICE",
		content: "",
		options: [
			{ id: "a", text: "選項 A" },
			{ id: "b", text: "選項 B" },
		],
		correctAnswer: "b",
		explanation: null,
		points: 1,
	},
	{
		id: "q-multiple",
		type: "MULTIPLE_CHOICE",
		content: "",
		options: [
			{ id: "a", text: "選項 A" },
			{ id: "b", text: "選項 B" },
			{ id: "c", text: "選項 C" },
		],
		correctAnswer: ["a", "c"],
		explanation: null,
		points: 1,
	},
	{
		id: "q-true-false",
		type: "TRUE_FALSE",
		content: "",
		options: [
			{ id: "true", text: "是" },
			{ id: "false", text: "否" },
		],
		correctAnswer: true,
		explanation: null,
		points: 1,
	},
	{
		id: "q-fill",
		type: "FILL_IN_BLANK",
		content: "",
		options: null,
		correctAnswer: ["StartKiter", "startkiter"],
		explanation: null,
		points: 1,
	},
];

export function QuizAdminForm({ lessons }: { lessons: LessonOption[] }) {
	const [title, setTitle] = useState("");
	const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
	const [passingScore, setPassingScore] = useState("60");
	const [showAnswers, setShowAnswers] = useState<QuizDefinitionBody["showAnswers"]>("IMMEDIATELY");
	const [questions, setQuestions] = useState(initialQuestions);
	const [createdId, setCreatedId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	function updateQuestion(index: number, content: string) {
		setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, content } : question));
	}

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const created = await orpcClient.quiz.create({
				title,
				body: {
					lessonId,
					passingScore: Number(passingScore),
					timeLimitMinutes: null,
					shuffleQuestions: false,
					shuffleOptions: false,
					showAnswers,
					blockNextLesson: false,
					questions,
				},
			});
			setCreatedId(created.id);
		} catch {
			setError("建立測驗失敗，請確認單元與題目內容完整。");
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
						<label className="grid gap-1 text-sm">
							<Label htmlFor="quiz-title">測驗名稱</Label>
							<Input id="quiz-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
						</label>
						<label className="grid gap-1 text-sm">
							<Label htmlFor="quiz-lesson">綁定單元</Label>
							<select id="quiz-lesson" className="h-9 rounded-xl border bg-card px-3" value={lessonId} onChange={(event) => setLessonId(event.target.value)} required>
								{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.courseTitle} / {lesson.chapterTitle} / {lesson.title}</option>)}
							</select>
						</label>
						<label className="grid gap-1 text-sm">
							<Label htmlFor="quiz-passing-score">及格分數</Label>
							<Input id="quiz-passing-score" type="number" min="0" max="100" value={passingScore} onChange={(event) => setPassingScore(event.target.value)} required />
						</label>
						<label className="grid gap-1 text-sm">
							<Label htmlFor="quiz-show-answers">答案顯示</Label>
							<select id="quiz-show-answers" className="h-9 rounded-xl border bg-card px-3" value={showAnswers} onChange={(event) => setShowAnswers(event.target.value as QuizDefinitionBody["showAnswers"])}>
								<option value="IMMEDIATELY">立即顯示</option>
								<option value="AFTER_PASS">通過後顯示</option>
								<option value="NEVER">不顯示</option>
							</select>
						</label>
					</div>

					<div className="space-y-4">
						<h2 className="text-lg font-semibold">題目（四種題型）</h2>
						{questions.map((question, index) => (
							<section key={question.id} className="space-y-3 rounded-2xl border p-4">
								<div className="flex items-center justify-between gap-3">
									<h3 className="font-medium">第 {index + 1} 題：{question.type}</h3>
									<span className="text-xs text-muted-foreground">{question.points} 分</span>
								</div>
								<label className="grid gap-1 text-sm">
									<Label htmlFor={`quiz-question-${index + 1}`}>題目內容</Label>
									<Input id={`quiz-question-${index + 1}`} value={question.content} onChange={(event) => updateQuestion(index, event.target.value)} required />
								</label>
								<p className="text-xs text-muted-foreground">
									{question.type === "SINGLE_CHOICE" && "單選題：預設正解為選項 B"}
									{question.type === "MULTIPLE_CHOICE" && "多選題：預設正解為選項 A、C"}
									{question.type === "TRUE_FALSE" && "是非題：預設正解為是"}
									{question.type === "FILL_IN_BLANK" && "填空題：預設可接受 StartKiter 與 startkiter"}
								</p>
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
