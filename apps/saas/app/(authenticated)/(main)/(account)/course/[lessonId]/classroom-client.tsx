"use client";

import {
	AlertCircleIcon,
	CheckCircle2Icon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CircleIcon,
	PanelLeftCloseIcon,
	PanelLeftOpenIcon,
	SendIcon,
	ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
	CourseMdxRenderer,
	FluentPlayerShell,
	type FluentVideoSource,
} from "@startkiter/course";
import { Button, Card, Input } from "@startkiter/ui";

type Progress = {
	completedCount: number;
	completedLessonIds: string[];
	percentage: number;
	totalCount: number;
};

type LessonData = {
	content: string | null;
	id: string;
	isFreePreview: boolean;
	title: string;
	videoDuration: string | null;
	videoSource: FluentVideoSource | null;
};

type CurriculumChapter = {
	id: string;
	lessons: Array<{
		id: string;
		isFreePreview: boolean;
		title: string;
		videoDuration: string | null;
	}>;
	title: string;
};

type TutorMessage = {
	content: string;
	role: "user" | "assistant";
};

export function AcademyClassroomClient({
	curriculum,
	initialLesson,
	initialProgress,
	isOperator,
}: {
	curriculum: CurriculumChapter[];
	initialLesson: LessonData;
	initialProgress: Progress;
	isOperator: boolean;
}) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isTutorOpen, setIsTutorOpen] = useState(true);
	const [progress, setProgress] = useState(initialProgress);
	const [currentTime, setCurrentTime] = useState(0);
	const [progressError, setProgressError] = useState<string | null>(null);
	const [messages, setMessages] = useState<TutorMessage[]>([]);
	const [question, setQuestion] = useState("");
	const [tutorError, setTutorError] = useState<string | null>(null);
	const [isTutorLoading, setIsTutorLoading] = useState(false);
	const playerSeek = useRef<(seconds: number) => void>(() => undefined);

	useEffect(() => {
		setProgress(initialProgress);
	}, [initialProgress]);

	useEffect(() => {
		setMessages([]);
		setQuestion("");
		setTutorError(null);
	}, [initialLesson.id]);

	const isCompleted = progress.completedLessonIds.includes(initialLesson.id);

	const persistProgress = async (type: "lesson" | "block", blockId?: string) => {
		setProgressError(null);
		const response = await fetch("/api/course/progress", {
			body: JSON.stringify({
				...(blockId ? { blockId } : {}),
				lessonId: initialLesson.id,
				type,
			}),
			headers: { "content-type": "application/json" },
			method: "POST",
		});
		const body = (await response.json()) as {
			error?: string;
			progress?: Progress;
		};
		if (!response.ok || !body.progress) {
			const message = body.error === "course_access_denied"
				? "目前帳號沒有完整課程權限，無法寫入學習進度。"
				: "學習進度暫時無法儲存，請稍後再試。";
			setProgressError(message);
			throw new Error(message);
		}
		setProgress(body.progress);
	};

	const submitTutorQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const text = question.trim();
		if (!text || isTutorLoading) {
			return;
		}

		const nextMessages = [...messages, { content: text, role: "user" as const }].slice(-12);
		setMessages(nextMessages);
		setQuestion("");
		setTutorError(null);
		setIsTutorLoading(true);

		try {
			const response = await fetch("/api/course/tutor", {
				body: JSON.stringify({ lessonId: initialLesson.id, messages: nextMessages }),
				headers: { "content-type": "application/json" },
				method: "POST",
			});
			const body = (await response.json()) as { answer?: string; error?: string };
			if (!response.ok || !body.answer) {
				setTutorError(
					body.error === "tutor_not_configured"
						? "AI 助教尚未設定服務金鑰。"
						: "AI 助教目前無法回覆，請稍後再問。",
				);
				return;
			}
			setMessages((current) => [...current, { content: body.answer!, role: "assistant" }]);
		} catch {
			setTutorError("AI 助教目前無法回覆，請稍後再問。");
		} finally {
			setIsTutorLoading(false);
		}
	};

	return (
		<div className="flex min-h-[calc(100vh-75px)] flex-col overflow-hidden bg-neutral-950 text-neutral-100">
			<header className="flex min-h-14 items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900/90 px-4">
				<div className="flex min-w-0 items-center gap-2">
					<Button
						aria-label={isSidebarOpen ? "收折課程大綱" : "展開課程大綱"}
						onClick={() => setIsSidebarOpen((open) => !open)}
						size="icon"
						title={isSidebarOpen ? "收折課程大綱" : "展開課程大綱"}
						variant="outline"
					>
						{isSidebarOpen ? <PanelLeftCloseIcon className="size-4" /> : <PanelLeftOpenIcon className="size-4" />}
					</Button>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold">電馭學院 · {initialLesson.title}</p>
						{initialLesson.isFreePreview ? (
							<p className="text-xs text-neutral-400">已發布試看單元</p>
						) : null}
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<div
						aria-label={"學習進度 " + progress.percentage + "%，" + progress.completedCount + "/" + progress.totalCount + " 單元"}
						className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs"
					>
						<strong className="text-emerald-400">{progress.percentage}%</strong>
						<span className="ml-1 text-neutral-300">
							{progress.completedCount}/{progress.totalCount} 單元
						</span>
					</div>
					<Button
						disabled={isCompleted}
						onClick={() => void persistProgress("lesson").catch(() => undefined)}
						size="sm"
						variant={isCompleted ? "secondary" : "primary"}
					>
						<CheckCircle2Icon className="mr-1.5 size-4" />
						{isCompleted ? "已完成" : "標記完成"}
					</Button>
				</div>
			</header>

			{isOperator ? (
				<div className="flex h-8 items-center justify-end bg-black px-4">
					<Link className="inline-flex items-center gap-1 text-xs text-neutral-100 hover:text-white" href="/admin/course">
						<ShieldCheckIcon className="size-3.5" />
						開啟 Course Studio
					</Link>
				</div>
			) : null}

			<div className="flex flex-1 overflow-hidden">
				<aside
					className={
						"border-r border-neutral-800 bg-neutral-900/60 transition-[width] duration-200 " +
						(isSidebarOpen ? "w-80" : "w-0 overflow-hidden border-r-0")
					}
				>
					<nav aria-label="課程大綱" className="h-full w-80 overflow-y-auto p-4">
						<h2 className="mb-3 text-xs font-semibold tracking-wide text-neutral-400">課程大綱</h2>
						<div className="space-y-4">
							{curriculum.map((chapter) => (
								<section key={chapter.id}>
									<h3 className="px-2 text-xs font-semibold text-neutral-300">{chapter.title}</h3>
									<div className="mt-1 space-y-1">
										{chapter.lessons.map((lesson) => {
											const done = progress.completedLessonIds.includes(lesson.id);
											const active = lesson.id === initialLesson.id;
											return (
												<Link
													aria-current={active ? "page" : undefined}
													className={
														"flex items-center gap-2 rounded-md px-2 py-2 text-xs transition " +
														(active
															? "bg-primary/20 text-primary"
															: "text-neutral-300 hover:bg-neutral-800")
													}
													href={"/course/" + lesson.id}
													key={lesson.id}
												>
													{done ? (
														<CheckCircle2Icon aria-label="已完成" className="size-4 shrink-0 text-emerald-400" />
													) : (
														<CircleIcon aria-hidden="true" className="size-3 shrink-0 text-neutral-500" />
													)}
													<span className="min-w-0 flex-1 truncate">{lesson.title}</span>
													<span className="text-[10px] text-neutral-500">{lesson.videoDuration ?? ""}</span>
												</Link>
											);
										})}
									</div>
								</section>
							))}
						</div>
					</nav>
				</aside>

				<main className="min-w-0 flex-1 overflow-y-auto">
					<div className="mx-auto max-w-5xl space-y-6 p-5 md:p-8">
						<FluentPlayerShell
							onSeekReady={(seek) => {
								playerSeek.current = seek;
							}}
							onTimeUpdate={setCurrentTime}
							source={initialLesson.videoSource}
							title={initialLesson.title}
						/>

						{progressError ? (
							<p className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200" role="alert">
								<AlertCircleIcon className="size-4 shrink-0" />
								{progressError}
							</p>
						) : null}

						<Card className="space-y-4 p-5">
							<div>
								<h1 className="text-xl font-semibold">{initialLesson.title}</h1>
								<p className="text-muted-foreground mt-1 text-sm">
									單元時長：{initialLesson.videoDuration ?? "尚未提供"}
								</p>
							</div>
							<CourseMdxRenderer
								content={initialLesson.content}
								currentTime={currentTime}
								onBlockComplete={(blockId) => persistProgress("block", blockId)}
								onSeek={(seconds) => playerSeek.current(seconds)}
							/>
						</Card>
					</div>
				</main>

				<aside
					className={
						"hidden border-l border-neutral-800 bg-neutral-900/70 lg:block " +
						(isTutorOpen ? "w-80" : "w-12")
					}
				>
					<div className="flex h-12 items-center justify-between border-b border-neutral-800 px-3">
						<span className={isTutorOpen ? "text-sm font-semibold" : "sr-only"}>隨課 AI 助教</span>
						<Button
							aria-label={isTutorOpen ? "收折 AI 助教" : "展開 AI 助教"}
							onClick={() => setIsTutorOpen((open) => !open)}
							size="icon"
							title={isTutorOpen ? "收折 AI 助教" : "展開 AI 助教"}
							variant="ghost"
						>
							{isTutorOpen ? <ChevronRightIcon className="size-4" /> : <ChevronLeftIcon className="size-4" />}
						</Button>
					</div>
					{isTutorOpen ? (
						<div className="flex h-[calc(100%-3rem)] flex-col">
							<div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-3">
								{messages.length === 0 ? (
									<p className="text-sm text-neutral-400">針對本節已授權講義提出問題。</p>
								) : null}
								{messages.map((message, index) => (
									<p
										className={
											"rounded-md p-2 text-sm " +
											(message.role === "user"
												? "bg-primary/20 text-primary-foreground"
												: "bg-neutral-800 text-neutral-200")
										}
										key={message.role + index}
									>
										{message.content}
									</p>
								))}
								{tutorError ? <p className="text-sm text-red-300">{tutorError}</p> : null}
							</div>
							<form className="border-t border-neutral-800 p-3" onSubmit={submitTutorQuestion}>
								<label className="sr-only" htmlFor="course-tutor-question">
									詢問本節 AI 助教
								</label>
								<div className="flex gap-2">
									<Input
										disabled={isTutorLoading}
										id="course-tutor-question"
										onChange={(event) => setQuestion(event.target.value)}
										placeholder="問本節內容"
										value={question}
									/>
									<Button aria-label="送出問題" disabled={isTutorLoading || !question.trim()} size="icon" type="submit">
										<SendIcon className="size-4" />
									</Button>
								</div>
							</form>
						</div>
					) : null}
				</aside>
			</div>
		</div>
	);
}
