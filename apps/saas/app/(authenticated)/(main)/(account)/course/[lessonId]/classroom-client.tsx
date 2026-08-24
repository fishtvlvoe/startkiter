"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenIcon, LightbulbIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Button, Card, Input } from "@startkiter/ui";
import {
	extractLessonBlockIds,
	FluentPlayer,
	LessonMdx,
	type WatermarkPlayerSettings,
} from "@startkiter/course";
import { resolveVideoSource } from "@startkiter/api/modules/course/lib/video-resolver";
import { orpc } from "@shared/lib/orpc-query-utils";

import { LessonCommentsPanel } from "./lesson-comments-panel";

interface LessonData {
	id: string;
	title: string;
	duration: string;
	isFreePreview: boolean;
	videoUrl: string;
	provider?: string;
	content: string;
	aiContext: string;
	courseTitle: string;
	watermarkSetting: Omit<WatermarkPlayerSettings, "email" | "courseTitle"> | null;
}

interface ChapterData {
	id: string;
	title: string;
	lessons: LessonData[];
}

export function AcademyClassroomClient({
	initialLesson,
	curriculum,
	viewerEmail,
}: {
	initialLesson: LessonData;
	curriculum: ChapterData[];
	viewerEmail: string;
}) {
	const queryClient = useQueryClient();
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isAiTutorOpen, setIsAiTutorOpen] = useState(true);
	const [currentLesson, setCurrentLesson] = useState<LessonData>(initialLesson);
	const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
		{
			role: "assistant",
			text: `你好！我是這門課的隨課 AI 助教。關於單元「${initialLesson.title}」有任何問題，隨時問我。`,
		},
	]);
	const [inputQuestion, setInputQuestion] = useState("");
	const [isAiLoading, setIsAiLoading] = useState(false);

	const learnerQuery = useQuery(orpc.course.getLearnerCurriculum.queryOptions());
	const completedLessonIds = learnerQuery.data?.progress.completedLessonIds ?? [];

	const toggleProgress = useMutation({
		...orpc.course.toggleLessonProgress.mutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: orpc.course.getLearnerCurriculum.key(),
			});
		},
	});
	const recordWatchTimeMutation = useMutation(orpc.course.recordWatchTime.mutationOptions());
	const handleWatchTime = useCallback(
		(watchedSec: number) => {
			recordWatchTimeMutation.mutate({ lessonId: currentLesson.id, watchedSec });
		},
		[currentLesson.id, recordWatchTimeMutation.mutate],
	);

	const allLessons = curriculum.flatMap((chapter) => chapter.lessons);
	const totalCount = allLessons.length;
	const completedCount = completedLessonIds.length;
	const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
	const isCompleted = completedLessonIds.includes(currentLesson.id);

	const resolvedVideo = useMemo(() => {
		if (!currentLesson.videoUrl) {
			return null;
		}

		return resolveVideoSource(currentLesson.videoUrl);
	}, [currentLesson.videoUrl]);

	const toggleCompletion = () => {
		if (completedLessonIds.includes(currentLesson.id) || toggleProgress.isPending) {
			return;
		}

		const [blockId] = extractLessonBlockIds(currentLesson.content);

		if (!blockId) {
			return;
		}

		toggleProgress.mutate({ lessonId: currentLesson.id, blockId });
	};

	const markLessonCompleteFromBlock = (blockId: string) => {
		if (!blockId || toggleProgress.isPending) {
			return;
		}

		toggleProgress.mutate({ lessonId: currentLesson.id, blockId });
	};

	const handleAskAi = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!inputQuestion.trim() || isAiLoading) {
			return;
		}

		const userQ = inputQuestion.trim();

		setInputQuestion("");
		setAiMessages((prev) => [...prev, { role: "user", text: userQ }]);
		setIsAiLoading(true);

		try {
			const response = await fetch("/api/course/ai", {
				method: "POST",
				credentials: "include",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					lessonId: currentLesson.id,
					question: userQ,
				}),
			});

			const payload = (await response.json().catch(() => ({}))) as {
				text?: string;
				message?: string;
			};

			const assistantText =
				typeof payload.text === "string" && payload.text.trim()
					? payload.text
					: payload.message || "AI 助教目前無法使用";

			setAiMessages((prev) => [...prev, { role: "assistant", text: assistantText }]);
		} catch {
			setAiMessages((prev) => [
				...prev,
				{ role: "assistant", text: "AI 助教目前無法使用" },
			]);
		} finally {
			setIsAiLoading(false);
		}
	};

	return (
		<div className="flex h-[calc(100vh-75px)] flex-col overflow-hidden bg-neutral-950 text-neutral-100">
			<div className="flex h-14 items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-4 backdrop-blur">
				<div className="flex items-center gap-3">
					<button
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-700"
						title={isSidebarOpen ? "收折課程大綱" : "展開課程大綱"}
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
						<span className="hidden sm:inline">{isSidebarOpen ? "收折大綱" : "展開大綱"}</span>
					</button>

					<span className="text-sm font-semibold text-neutral-200">
						教室 · <span className="text-primary">{currentLesson.title}</span>
					</span>
				</div>

				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs">
						<svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span className="font-medium text-neutral-300">
							學習進度 <strong className="text-emerald-400">{progressPercentage}%</strong> (
							{completedCount}/{totalCount} 單元)
						</span>
					</div>

					<Button
						variant={isCompleted ? "primary" : "outline"}
						size="sm"
						onClick={toggleCompletion}
						disabled={toggleProgress.isPending}
						className={isCompleted ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}
					>
						<svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						{isCompleted ? "已完成單元" : "標記為完成"}
					</Button>
				</div>
			</div>

			<div className="flex flex-1 overflow-hidden">
				<div
					className={`flex flex-col border-r border-neutral-800 bg-neutral-900/60 transition-all duration-300 ${
						isSidebarOpen ? "w-80" : "w-0 overflow-hidden border-none"
					}`}
				>
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						<h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">課程章節大綱</h3>
						{curriculum.map((chapter) => (
							<div key={chapter.id} className="space-y-1">
								<p className="px-2 py-1 text-xs font-semibold text-neutral-300">{chapter.title}</p>
								<div className="space-y-1">
									{chapter.lessons.map((lesson) => {
										const isLessonDone = completedLessonIds.includes(lesson.id);
										const isActive = currentLesson.id === lesson.id;

										return (
											<div
												key={lesson.id}
												onClick={() => setCurrentLesson(lesson)}
												className={`flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs transition-colors ${
													isActive
														? "bg-primary/20 text-primary font-medium border border-primary/40"
														: "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
												}`}
											>
												<div className="flex items-center gap-2 overflow-hidden">
													{isLessonDone ? (
														<svg
															className="h-4 w-4 shrink-0 text-emerald-400"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M5 13l4 4L19 7"
															/>
														</svg>
													) : (
														<div className="h-2 w-2 shrink-0 rounded-full bg-neutral-600" />
													)}
													<span className="truncate">{lesson.title}</span>
												</div>
												<span className="text-[10px] font-mono text-neutral-500">{lesson.duration}</span>
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-1 flex-col overflow-y-auto">
					<div className="mx-auto w-full max-w-4xl p-6 space-y-6">
						<Card className="overflow-hidden border-neutral-800 bg-black p-0 shadow-2xl">
							<div className="relative aspect-video w-full bg-neutral-900">
								<FluentPlayer
									title={currentLesson.title}
									resolved={resolvedVideo}
									watermark={
										currentLesson.watermarkSetting
											? {
													...currentLesson.watermarkSetting,
													email: viewerEmail,
													courseTitle: currentLesson.courseTitle,
												}
											: undefined
									}
									onWatchTime={handleWatchTime}
								/>
							</div>
						</Card>

						<div className="border-b border-neutral-800 pb-4">
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold">{currentLesson.title}</h1>
								{currentLesson.isFreePreview && (
									<span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
										開放公開試看
									</span>
								)}
							</div>
							<p className="mt-1 text-sm text-neutral-400">單元時長：{currentLesson.duration}</p>
						</div>

						<div className="space-y-6 text-sm leading-relaxed text-neutral-300">
							<div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
								<h2 className="flex items-center gap-2 text-base font-bold text-neutral-100">
									<BookOpenIcon className="h-4 w-4" />
									本節講義
								</h2>
								<LessonMdx
									source={currentLesson.content}
									onInteractiveComplete={markLessonCompleteFromBlock}
								/>
							</div>
						</div>
						<LessonCommentsPanel lessonId={currentLesson.id} />
					</div>
				</div>

				<div
					className={`flex flex-col border-l border-neutral-800 bg-neutral-900/80 transition-all duration-300 ${
						isAiTutorOpen ? "w-80" : "w-0 overflow-hidden border-none"
					}`}
				>
					<div className="flex h-12 items-center justify-between border-b border-neutral-800 px-4">
						<div className="flex items-center gap-2">
							<LightbulbIcon className="h-4 w-4 text-primary" />
							<span className="text-xs font-bold">隨課 AI 助教</span>
						</div>
						<button
							onClick={() => setIsAiTutorOpen(false)}
							className="text-neutral-500 hover:text-neutral-300"
							title="關閉助教"
							type="button"
						>
							<XIcon className="h-4 w-4" />
						</button>
					</div>

					<div className="flex-1 overflow-y-auto p-3 space-y-3">
						{aiMessages.map((msg, idx) => (
							<div
								key={idx}
								className={`rounded-lg p-3 text-xs leading-relaxed ${
									msg.role === "assistant"
										? "border border-neutral-800 bg-neutral-800/70 text-neutral-200"
										: "bg-primary text-white ml-4"
								}`}
							>
								{msg.text}
							</div>
						))}
						{isAiLoading && <div className="text-xs text-neutral-500 italic">AI 助教思考中...</div>}
					</div>

					<form onSubmit={handleAskAi} className="border-t border-neutral-800 p-3">
						<div className="flex gap-2">
							<Input
								value={inputQuestion}
								onChange={(event) => setInputQuestion(event.target.value)}
								placeholder="向助教詢問本單元重點..."
								className="text-xs"
							/>
							<Button size="sm" type="submit" disabled={isAiLoading}>
								發送
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
