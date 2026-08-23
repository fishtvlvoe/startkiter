"use client";

import { useEffect, useState, type DragEvent } from "react";
import { Button, Card, Input, Label, Textarea } from "@startkiter/ui";
import { CourseStudioContentPreview } from "@shared/components/CourseStudioContentPreview";
import { reorderLesson } from "./reorder-lessons";
import { getCourseStudioErrorMessage, type CourseStudioErrorResponse } from "./studio-error-message";

type ProviderType = "BUNNY" | "YOUTUBE" | "VIMEO" | "CUSTOM_MP4" | "HLS";

interface LessonItem {
	id: string;
	title: string;
	duration: string;
	isFreePreview: boolean;
	videoUrl: string;
	provider?: ProviderType;
	content: string;
	aiContext: string;
	/** API／資料庫位置；有值時採 0-based，第一個單元是 0。 */
	order?: number;
}

interface ChapterItem {
	id: string;
	title: string;
	lessons: LessonItem[];
	/** API／資料庫位置；有值時採 0-based，第一個章節是 0。 */
	order?: number;
}

interface StudioFolderResponse {
	id: string;
	name: string;
	order: number;
	isCollapsed: boolean;
}

interface StudioChapterResponse {
	id: string;
	courseId: string;
	title: string;
	/** 章節 order 儲存為 0-based 位置。 */
	order: number;
}

interface StudioLessonResponse {
	id: string;
	chapterId: string;
	slug: string;
	title: string;
	content: string | null;
	isFreePreview: boolean;
	/** 單元 order 儲存為 0-based 位置。 */
	order: number;
	videoProvider: ProviderType | null;
	videoUrl: string | null;
	videoDuration: string | null;
	aiContext: string | null;
}

type StudioResponse = CourseStudioErrorResponse & {
	folder?: StudioFolderResponse | null;
	chapter?: StudioChapterResponse | null;
	lesson?: StudioLessonResponse | null;
};

interface StudioMessage {
	type: "success" | "error";
	text: string;
}

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
		</svg>
	);
}

function ErrorIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
		</svg>
	);
}

export default function CourseAdminStudioPage() {
	// 全域提示訊息（替代 alert）
	const [message, setMessage] = useState<StudioMessage | null>(null);

	// 資料夾管理狀態
	const [folders, setFolders] = useState<Array<{ id: string; name: string; isCollapsed: boolean }>>([
		{ id: "f1", name: "產品業務", isCollapsed: false },
		{ id: "f2", name: "營運管理", isCollapsed: false },
	]);
	const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
	const [editingFolderName, setEditingFolderName] = useState("");

	// 課綱狀態
	const [courseId, setCourseId] = useState<string | null>(null);
	const [chapters, setChapters] = useState<ChapterItem[]>([]);
	const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
	const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
	const [videoInputUrl, setVideoInputUrl] = useState("");
	const [resolvedCard, setResolvedCard] = useState<{
		provider: ProviderType;
		sourceId?: string;
		status: "valid" | "invalid";
	} | null>(null);

	// 自動清除提示訊息
	useEffect(() => {
		if (!message) return;
		const timer = setTimeout(() => setMessage(null), 4000);
		return () => clearTimeout(timer);
	}, [message]);

	async function callStudio(action: string, payload: Record<string, unknown>) {
		const res = await fetch("/api/course/studio", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action, payload }),
		});
		const data = (await res.json().catch(() => ({}))) as StudioResponse;
		if (!res.ok) {
			return {
				ok: false as const,
				data,
				error: typeof data.error === "string" ? data.error : `HTTP ${res.status}`,
			};
		}
		return { ok: true as const, data, error: null };
	}

	function showMessage(type: "success" | "error", text: string) {
		setMessage({ type, text });
	}

	// 載入真實資料庫課綱與資料夾
	useEffect(() => {
		fetch("/api/course/studio")
			.then((res) => res.json())
			.then((data) => {
				if (data.courses && data.courses.length > 0) {
					const firstCourse = data.courses[0];
					setCourseId(firstCourse.id);
					const mappedChapters: ChapterItem[] = firstCourse.chapters.map((ch: any) => ({
						id: ch.id,
						title: ch.title,
						lessons: ch.lessons.map((l: any) => ({
							id: l.id,
							title: l.title,
							duration: l.videoDuration || "10:00",
							isFreePreview: l.isFreePreview,
							videoUrl: l.videoUrl || "",
							provider: l.videoProvider || undefined,
							content: l.content || "",
							aiContext: l.aiContext || "",
						})),
					}));
					setChapters(mappedChapters);
					if (mappedChapters[0]?.lessons[0]) {
						const firstL = mappedChapters[0].lessons[0];
						setSelectedLesson(firstL);
						setVideoInputUrl(firstL.videoUrl);
						handleVideoUrlChange(firstL.videoUrl);
					}
				}
				if (data.folders && data.folders.length > 0) {
					setFolders(data.folders);
				}
			})
			.catch((e) => showMessage("error", "載入後台資料失敗: " + String(e)));
	}, []);

	// 貼上影片網址時的智慧解析
	const handleVideoUrlChange = (url: string) => {
		setVideoInputUrl(url);
		const trimmed = url.trim();
		if (!trimmed) {
			setResolvedCard(null);
			return;
		}

		if (trimmed.includes("mediadelivery.net") || trimmed.includes("bunny")) {
			setResolvedCard({ provider: "BUNNY", sourceId: "12345/bunny-demo", status: "valid" });
		} else if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
			setResolvedCard({ provider: "YOUTUBE", sourceId: "dQw4w9WgXcQ", status: "valid" });
		} else if (trimmed.includes("vimeo.com")) {
			setResolvedCard({ provider: "VIMEO", sourceId: "123456789", status: "valid" });
		} else if (trimmed.endsWith(".mp4")) {
			setResolvedCard({ provider: "CUSTOM_MP4", status: "valid" });
		} else {
			setResolvedCard({ provider: "CUSTOM_MP4", status: "invalid" });
		}
	};

	// 新增資料夾
	const handleCreateFolder = async () => {
		const name = prompt("請輸入新資料夾名稱：");
		if (!name) return;
		const result = await callStudio("create_folder", { name });
		if (result.ok && result.data.folder) {
			setFolders([...folders, result.data.folder]);
			showMessage("success", "資料夾新增成功");
		} else {
			showMessage("error", "資料夾新增失敗");
		}
	};

	// 切換資料夾收折（個人偏好，寫入資料庫）
	const handleToggleFolderCollapse = async (folderId: string) => {
		const folder = folders.find((f) => f.id === folderId);
		if (!folder) return;
		const nextCollapsed = !folder.isCollapsed;
		const result = await callStudio("update_folder", { id: folderId, isCollapsed: nextCollapsed });
		if (result.ok) {
			setFolders(folders.map((f) => (f.id === folderId ? { ...f, isCollapsed: nextCollapsed } : f)));
		} else {
			showMessage("error", "資料夾收折狀態儲存失敗");
		}
	};

	// 儲存資料夾名稱變更
	const handleSaveFolderName = async (folderId: string) => {
		const result = await callStudio("update_folder", { id: folderId, name: editingFolderName });
		if (result.ok) {
			setFolders(folders.map((f) => (f.id === folderId ? { ...f, name: editingFolderName } : f)));
			setEditingFolderId(null);
			showMessage("success", "資料夾名稱已更新");
		} else {
			showMessage("error", "資料夾名稱更新失敗");
		}
	};

	// 新增章節
	const handleCreateChapter = async () => {
		if (!courseId) {
			showMessage("error", "尚未載入課程資料");
			return;
		}
		const title = prompt("請輸入章節名稱：");
		if (!title) return;
		const result = await callStudio("create_chapter", { courseId, title });
		if (result.ok && result.data.chapter) {
			setChapters([...chapters, { ...result.data.chapter, lessons: [] }]);
			showMessage("success", "章節新增成功");
		} else {
			showMessage("error", "章節新增失敗");
		}
	};

	// 新增單元
	const handleCreateLesson = async (chapterId: string) => {
		const title = prompt("請輸入單元名稱：");
		if (!title) return;
		const result = await callStudio("create_lesson", { chapterId, title });
		if (result.ok && result.data.lesson) {
			const newL: LessonItem = {
				id: result.data.lesson.id,
				title: result.data.lesson.title,
				duration: result.data.lesson.videoDuration || "10:00",
				isFreePreview: result.data.lesson.isFreePreview,
				videoUrl: result.data.lesson.videoUrl || "",
				provider: result.data.lesson.videoProvider || undefined,
				content: result.data.lesson.content || "# 新單元",
				aiContext: result.data.lesson.aiContext || "",
			};
			setChapters(
				chapters.map((c) =>
					c.id === chapterId ? { ...c, lessons: [...c.lessons, newL] } : c,
				),
			);
			setSelectedLesson(newL);
			setVideoInputUrl("");
			setResolvedCard(null);
			showMessage("success", "單元新增成功");
		} else {
			showMessage("error", "單元新增失敗");
		}
	};

	// 刪除單元
	const handleDeleteLesson = async (lesson: LessonItem) => {
		if (!confirm(`確定要刪除「${lesson.title}」嗎？`)) return;
		const result = await callStudio("delete_lesson", { id: lesson.id });
		if (result.ok) {
			setChapters(
				chapters.map((c) => ({
					...c,
					lessons: c.lessons.filter((l) => l.id !== lesson.id),
				})),
			);
			if (selectedLesson?.id === lesson.id) setSelectedLesson(null);
			showMessage("success", "單元已刪除");
		} else {
			showMessage("error", "單元刪除失敗");
		}
	};

	const handleLessonDragStart = (event: DragEvent<HTMLDivElement>, lessonId: string) => {
		setDraggedLessonId(lessonId);
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", lessonId);
	};

	const handleLessonDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	};

	const handleLessonDrop = async (
		event: DragEvent<HTMLDivElement>,
		targetChapterId: string,
		targetIndex: number,
	) => {
		event.preventDefault();
		event.stopPropagation();
		const lessonId = event.dataTransfer.getData("text/plain") || draggedLessonId;
		if (!lessonId) return;

		try {
			const nextChapters = await reorderLesson(
				chapters,
				lessonId,
				targetChapterId,
				targetIndex,
				(payload) => callStudio("reorder_lessons", payload),
			);
			setChapters(nextChapters);
			setSelectedLesson((current) => {
				if (!current) return current;
				return nextChapters.flatMap((chapter) => chapter.lessons).find((lesson) => lesson.id === current.id) ?? current;
			});
			showMessage("success", "單元排序已儲存");
		} catch {
			showMessage("error", "單元排序儲存失敗");
		} finally {
			setDraggedLessonId(null);
		}
	};

	// 儲存單元至真實資料庫
	const handleSaveLesson = async () => {
		if (!selectedLesson) return;
		const updated = {
			...selectedLesson,
			videoUrl: videoInputUrl,
			provider: resolvedCard?.status === "valid" ? resolvedCard.provider : undefined,
		};

		try {
			const result = await callStudio("update_lesson", {
				id: updated.id,
				title: updated.title,
				videoUrl: updated.videoUrl,
				videoDuration: updated.duration,
				isFreePreview: updated.isFreePreview,
				content: updated.content,
				aiContext: updated.aiContext,
			});

			if (result.ok) {
				setSelectedLesson(updated);
				setChapters((prev) =>
					prev.map((ch) => ({
						...ch,
						lessons: ch.lessons.map((l) => (l.id === updated.id ? updated : l)),
					})),
				);
				showMessage("success", "單元變更已成功持久化至 PostgreSQL 資料庫");
				} else {
					showMessage("error", getCourseStudioErrorMessage(result.data));
				}
		} catch (e) {
			showMessage("error", "儲存發生錯誤: " + String(e));
		}
	};

	return (
		<div className="flex h-[calc(100vh-80px)] flex-col gap-4 overflow-hidden p-6">
			{/* 全域提示訊息 */}
			{message && (
				<div
					className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
						message.type === "success"
							? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
							: "border-rose-500/30 bg-rose-500/10 text-rose-300"
					}`}
				>
					{message.type === "success" ? (
						<CheckIcon className="h-4 w-4" />
					) : (
						<ErrorIcon className="h-4 w-4" />
					)}
					<span>{message.text}</span>
				</div>
			)}

			{/* 頂部 Admin Bar */}
			<div className="flex items-center justify-between border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold">電馭學院 · Course Studio (總管理後台)</h1>
					<p className="text-muted-foreground text-sm">
						WordPress 式資訊架構 · Fluent Player 統一影音解析 · 純向量 SVG
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={() => window.open("/course", "_blank")}>
						{/* 預覽前台 SVG */}
						<svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
						預覽學員教室
					</Button>
					<Button size="sm" onClick={handleSaveLesson}>
						{/* 發布/儲存 SVG */}
						<svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						發布變更
					</Button>
				</div>
			</div>

			{/* 主工作區：三欄式 */}
			<div className="grid flex-1 grid-cols-12 gap-6 overflow-hidden">
				{/* 1. 左側：資料夾與章節單元樹 */}
				<div className="col-span-4 flex flex-col gap-4 overflow-y-auto border-r pr-4">
					{/* 資料夾分組 */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold uppercase text-neutral-400">功能群組 / 資料夾</span>
							<button onClick={handleCreateFolder} className="text-xs text-primary hover:underline">
								+ 新增分組
							</button>
						</div>

						{folders.map((f) => (
							<div key={f.id} className="rounded-lg border bg-neutral-900/50 p-2 text-sm">
								<div className="flex items-center justify-between">
									<div
										className="flex cursor-pointer items-center gap-2"
										onClick={() => handleToggleFolderCollapse(f.id)}
									>
										{/* 折疊 SVG */}
										<svg
											className={`h-4 w-4 transition-transform ${f.isCollapsed ? "-rotate-90" : ""}`}
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
										</svg>
										{editingFolderId === f.id ? (
											<input
												value={editingFolderName}
												onChange={(e) => setEditingFolderName(e.target.value)}
												onBlur={() => handleSaveFolderName(f.id)}
												onKeyDown={(e) => {
													if (e.key === "Enter") handleSaveFolderName(f.id);
												}}
												className="rounded bg-neutral-800 px-1 text-xs"
												autoFocus
											/>
										) : (
											<span className="font-medium">{f.name}</span>
										)}
									</div>
									<div className="flex items-center gap-1">
										{/* 改名 SVG */}
										<button
											onClick={() => {
												setEditingFolderId(f.id);
												setEditingFolderName(f.name);
											}}
											className="p-1 hover:text-primary"
											title="改名"
										>
											<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
												/>
											</svg>
										</button>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* 課綱清單 */}
					<div className="space-y-4 pt-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold uppercase text-neutral-400">課程單元編排</span>
							<button onClick={handleCreateChapter} className="text-xs text-primary hover:underline">
								+ 新增章節
							</button>
						</div>

						{chapters.map((ch) => (
							<div key={ch.id} className="space-y-2">
								<div className="flex items-center justify-between rounded bg-neutral-800/80 px-2 py-1.5 text-xs font-semibold text-neutral-300">
									<span>{ch.title}</span>
									<button
										onClick={() => handleCreateLesson(ch.id)}
										className="text-primary hover:underline"
									>
										+ 單元
									</button>
								</div>

								{/* 單元列表 */}
								<div
									className="space-y-1 pl-2"
									onDragOver={handleLessonDragOver}
									onDrop={(event) => handleLessonDrop(event, ch.id, ch.lessons.length)}
								>
									{ch.lessons.map((lesson) => (
										<div
										draggable
											key={lesson.id}
										onDragStart={(event) => handleLessonDragStart(event, lesson.id)}
										onDragOver={handleLessonDragOver}
										onDrop={(event) => handleLessonDrop(event, ch.id, ch.lessons.indexOf(lesson))}
										data-lesson-id={lesson.id}
										onClick={() => {
												setSelectedLesson(lesson);
												setVideoInputUrl(lesson.videoUrl);
												handleVideoUrlChange(lesson.videoUrl);
											}}
											className={`flex cursor-pointer items-center justify-between rounded-md p-2 text-xs transition-colors ${
												selectedLesson?.id === lesson.id
													? "border border-primary/50 bg-primary/10 text-primary"
													: "hover:bg-neutral-800/50"
											}`}
										>
											<div className="flex items-center gap-2 overflow-hidden">
												{lesson.isFreePreview && (
													<span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[10px] text-emerald-400">
														試看
													</span>
												)}
												<span className="truncate">{lesson.title}</span>
											</div>

											{/* 操作 Icon 按鈕列 */}
											<div className="flex items-center gap-1 opacity-80 hover:opacity-100">
												{/* 編輯 Icon */}
												<button
													className="p-1 hover:text-primary"
													title="編輯單元"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedLesson(lesson);
														setVideoInputUrl(lesson.videoUrl);
														handleVideoUrlChange(lesson.videoUrl);
													}}
												>
													<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
														/>
													</svg>
												</button>

												{/* 預覽 Icon */}
												<button
													className="p-1 hover:text-emerald-400"
													title="預覽播放"
													onClick={(e) => {
														e.stopPropagation();
														window.open(`/course/${lesson.id}`, "_blank");
													}}
												>
													<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
												</button>

												{/* 刪除 Icon */}
												<button
													className="p-1 hover:text-rose-400"
													title="刪除單元"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteLesson(lesson);
													}}
												>
													<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
														/>
													</svg>
												</button>
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* 2. 中間與右側：單元編輯工作臺 */}
				<div className="col-span-8 flex flex-col gap-4 overflow-y-auto pr-2">
					{selectedLesson ? (
						<div className="space-y-6">
							{/* 單元基本設定 */}
							<Card className="space-y-4 p-4">
								<h2 className="text-base font-semibold text-neutral-200">單元基本設定</h2>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label>單元名稱</Label>
										<Input
											value={selectedLesson.title}
											onChange={(e) => setSelectedLesson({ ...selectedLesson, title: e.target.value })}
											className="mt-1"
										/>
									</div>
									<div className="flex items-end gap-4">
										<div className="flex-1">
											<Label>時長 (MM:SS)</Label>
											<Input
												value={selectedLesson.duration}
												onChange={(e) =>
													setSelectedLesson({ ...selectedLesson, duration: e.target.value })
												}
												className="mt-1"
											/>
										</div>
										<label className="flex cursor-pointer items-center gap-2 pb-2 text-xs">
											<input
												type="checkbox"
												checked={selectedLesson.isFreePreview}
												onChange={(e) =>
													setSelectedLesson({ ...selectedLesson, isFreePreview: e.target.checked })
												}
												className="rounded border-neutral-700"
											/>
											<span>開放公開試看</span>
										</label>
									</div>
								</div>
							</Card>

							{/* 統一影音配置 (Fluent Player Shell) */}
							<Card className="space-y-4 p-4">
								<div className="flex items-center justify-between">
									<h2 className="text-base font-semibold text-neutral-200">
										統一影音配置 (Fluent Player Shell)
									</h2>
									<span className="text-xs text-neutral-400">
										支援 Bunny.net / YouTube / Vimeo / MP4 直連
									</span>
								</div>

								<div>
									<Label>貼上影片網址 (自動解析)</Label>
									<Input
										value={videoInputUrl}
										onChange={(e) => handleVideoUrlChange(e.target.value)}
										placeholder="https://iframe.mediadelivery.net/... 或 https://www.youtube.com/watch?v=..."
										className="mt-1 font-mono text-xs"
									/>
								</div>

								{/* 自動解析資訊卡 */}
								{resolvedCard && (
									<div
										className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
											resolvedCard.status === "valid"
												? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
												: "border-rose-500/30 bg-rose-500/10 text-rose-300"
										}`}
									>
										<div className="flex items-center gap-3">
											{/* 播放器狀態 SVG */}
											<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
												/>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
											<div>
												<p className="font-semibold">
													{resolvedCard.status === "valid"
														? `解析成功：${resolvedCard.provider}`
														: "無法識別此影音來源"}
												</p>
												<p className="text-[11px] opacity-80">
													{resolvedCard.status === "valid"
														? `識別碼: ${resolvedCard.sourceId || "直連檔案"} · 符合 Fluent Player 規範`
														: "僅支援 Bunny.net, YouTube, Vimeo, 與 HTTPS 直連 MP4"}
												</p>
											</div>
										</div>
										<span className="rounded bg-black/40 px-2 py-1 font-mono text-[10px]">
											{resolvedCard.status === "valid" ? "READY" : "ERROR"}
										</span>
									</div>
								)}
							</Card>

							{/* MDX 講義內容與 AI Context */}
							<div className="grid grid-cols-2 gap-4">
								<Card className="space-y-2 p-4">
									<Label>MDX 講義內容 (支援 8 款純向量 SVG 互動積木)</Label>
									<Textarea
										value={selectedLesson.content}
										onChange={(e) => setSelectedLesson({ ...selectedLesson, content: e.target.value })}
										rows={10}
										className="font-mono text-xs"
									/>
								</Card>

								<Card className="space-y-2 p-4">
									<Label>內容即時預覽</Label>
									<CourseStudioContentPreview source={selectedLesson.content} />
								</Card>

								<Card className="col-span-2 space-y-2 p-4">
									<Label>隨課文字 AI 助教 Context (僅本單元有效)</Label>
									<Textarea
										value={selectedLesson.aiContext}
										onChange={(e) =>
											setSelectedLesson({ ...selectedLesson, aiContext: e.target.value })
										}
										rows={10}
										placeholder="輸入提供給隨課 AI 助教的重點知識或回答邊界..."
										className="font-mono text-xs"
									/>
								</Card>
							</div>
						</div>
					) : (
						<div className="flex h-full items-center justify-center text-neutral-500">
							請由左側選擇或新增單元進行編輯
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
