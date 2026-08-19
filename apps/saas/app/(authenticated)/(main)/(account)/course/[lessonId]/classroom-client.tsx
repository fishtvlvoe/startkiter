"use client";

import { useState } from "react";
import { Button, Card, Input } from "@startkiter/ui";
import { InstantQuiz, ConceptCompare, MicroSandbox } from "@startkiter/course";

interface LessonData {
	id: string;
	title: string;
	duration: string;
	isFreePreview: boolean;
	videoUrl: string;
	provider?: string;
	content: string;
	aiContext: string;
}

interface ChapterData {
	id: string;
	title: string;
	lessons: LessonData[];
}

export function AcademyClassroomClient({
	initialLesson,
	curriculum,
}: {
	initialLesson: LessonData;
	curriculum: ChapterData[];
}) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isAiTutorOpen, setIsAiTutorOpen] = useState(true);
	const [currentLesson, setCurrentLesson] = useState<LessonData>(initialLesson);

	// 完成狀態與進度計算
	const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(["l1", "l2"]);
	const allLessons = curriculum.flatMap((c) => c.lessons);
	const totalCount = allLessons.length;
	const completedCount = completedLessonIds.length;
	const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

	const isCompleted = completedLessonIds.includes(currentLesson.id);

	// 隨課 AI 助教對話狀態
	const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
		{
			role: "assistant",
			text: `👋 你好！我是電馭學院的隨課 AI 助教。關於單元「${currentLesson.title}」有任何問題，隨時問我！`,
		},
	]);
	const [inputQuestion, setInputQuestion] = useState("");
	const [isAiLoading, setIsAiLoading] = useState(false);

	const toggleCompletion = () => {
		if (isCompleted) {
			setCompletedLessonIds(completedLessonIds.filter((id) => id !== currentLesson.id));
		} else {
			setCompletedLessonIds([...completedLessonIds, currentLesson.id]);
		}
	};

	const handleAskAi = (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputQuestion.trim() || isAiLoading) return;

		const userQ = inputQuestion.trim();
		setInputQuestion("");
		setAiMessages((prev) => [...prev, { role: "user", text: userQ }]);
		setIsAiLoading(true);

		setTimeout(() => {
			setAiMessages((prev) => [
				...prev,
				{
					role: "assistant",
					text: `針對單元「${currentLesson.title}」的提問：\n\n${userQ}\n\n💡 重點在於掌握微內核 4 Mount Points 與 Fluent Player 影音管線。`,
				},
			]);
			setIsAiLoading(false);
		}, 1000);
	};

	return (
		<div className="flex h-[calc(100vh-75px)] flex-col overflow-hidden bg-neutral-950 text-neutral-100">
			{/* 頂部常駐學習進度條 */}
			<div className="flex h-14 items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-4 backdrop-blur">
				<div className="flex items-center gap-3">
					{/* 大綱收折按鈕 */}
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
						電馭學院 · <span className="text-primary">{currentLesson.title}</span>
					</span>
				</div>

				{/* 頂部進度膠囊 (38% · 3/8 單元) */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs">
						<svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span className="font-medium text-neutral-300">
							學習進度 <strong className="text-emerald-400">{progressPercentage}%</strong> ({completedCount}/{totalCount} 單元)
						</span>
					</div>

					<Button
						variant={isCompleted ? "primary" : "outline"}
						size="sm"
						onClick={toggleCompletion}
						className={isCompleted ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""}
					>
						<svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						{isCompleted ? "已完成單元" : "標記為完成"}
					</Button>
				</div>
			</div>

			{/* 主教室工作區 */}
			<div className="flex flex-1 overflow-hidden">
				{/* 1. 左側大綱側欄 (可收折) */}
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
														<svg className="h-4 w-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

				{/* 2. 中間：Fluent Player 播放器與講義內容 */}
				<div className="flex flex-1 flex-col overflow-y-auto">
					<div className="mx-auto w-full max-w-4xl p-6 space-y-6">
						{/* Fluent Player 統一播放器 Shell */}
						<Card className="overflow-hidden border-neutral-800 bg-black p-0 shadow-2xl">
							<div className="relative aspect-video w-full bg-neutral-900">
								{currentLesson.videoUrl.includes("youtube") ? (
									<iframe
										className="h-full w-full"
										src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0"
										title={currentLesson.title}
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowFullScreen
									/>
								) : currentLesson.videoUrl.includes("mediadelivery.net") ? (
									<iframe
										className="h-full w-full"
										src={currentLesson.videoUrl}
										title={currentLesson.title}
										allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
										allowFullScreen
									/>
								) : (
									<div className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-400">
										<svg className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<p className="text-sm font-medium">Fluent Player Shell · 16:9 統一播放器</p>
									</div>
								)}
							</div>
						</Card>

						{/* 單元標題與試看標籤 */}
						<div className="border-b border-neutral-800 pb-4">
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold">{currentLesson.title}</h1>
								{currentLesson.isFreePreview && (
									<span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
										開放公開試看
									</span>
								)}
							</div>
							<p className="mt-1 text-sm text-neutral-400">單元時長：{currentLesson.duration} · 電馭學院官方原創</p>
						</div>

						{/* MDX 講義內容與 7 款純向量 SVG 互動積木展示 */}
						<div className="space-y-6 text-sm leading-relaxed text-neutral-300">
							<div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 space-y-4">
								<h2 className="text-base font-bold text-neutral-100">📖 本節精選互動積木</h2>

								{/* 1. InstantQuiz 隨堂測驗 */}
								<InstantQuiz
									question="StartKiter 電馭學院的影音播放系統，主要支援哪一種統一架構？"
									options={[
										"Cloudflare Stream 專屬架構",
										"Fluent Player Shell（支援 Bunny / YouTube / Vimeo / MP4 直連）",
										"第三方 LMS 外部嵌入",
									]}
									answerIndex={1}
									explanation="正確！電馭學院採用 Fluent Player Shell 統一播放器，相容多種影音來源且外觀一致。"
								/>

								{/* 2. ConceptCompare 概念對照 */}
								<ConceptCompare
									tabs={[
										{
											title: "傳統 LMS",
											description: "繁重、高度綁定 WordPress 或第三方平台、缺乏代碼自主權。",
										},
										{
											title: "StartKiter 微內核",
											description: "4 Mount Points 單一註冊、Prisma 持久化、純向量 SVG、買斷終身代碼包。",
										},
									]}
								/>

								{/* 3. MicroSandbox 程式碼微沙盒 */}
								<MicroSandbox
									controls={[
										{
											name: "mode",
											label: "微內核模組模式",
											type: "select",
											default: "course",
											options: [
												{ value: "course", label: "電馭學院 (Course)" },
												{ value: "deployment", label: "買家部署 (Deployment)" },
											],
										},
									]}
									renderPreview={(values) => (
										<div className="rounded bg-neutral-900 p-2 font-mono text-xs text-primary">
											啟用模組: {String(values.mode)}
										</div>
									)}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* 3. 右側：隨課文字 AI 助教工作區 (可收折) */}
				<div
					className={`flex flex-col border-l border-neutral-800 bg-neutral-900/80 transition-all duration-300 ${
						isAiTutorOpen ? "w-80" : "w-0 overflow-hidden border-none"
					}`}
				>
					{/* AI 頂部 Bar */}
					<div className="flex h-12 items-center justify-between border-b border-neutral-800 px-4">
						<div className="flex items-center gap-2">
							<svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							<span className="text-xs font-bold">隨課 AI 助教</span>
						</div>
						<button
							onClick={() => setIsAiTutorOpen(false)}
							className="text-neutral-500 hover:text-neutral-300"
							title="關閉助教"
						>
							✕
						</button>
					</div>

					{/* 對話歷史 */}
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
						{isAiLoading && (
							<div className="text-xs text-neutral-500 italic">AI 助教思考中...</div>
						)}
					</div>

					{/* 提問輸入框 */}
					<form onSubmit={handleAskAi} className="border-t border-neutral-800 p-3">
						<div className="flex gap-2">
							<Input
								value={inputQuestion}
								onChange={(e) => setInputQuestion(e.target.value)}
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
