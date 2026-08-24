"use client";

import { useEffect, useState, type DragEvent } from "react";
import {
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
} from "@startkiter/ui";
import { CourseStudioContentPreview } from "@shared/components/CourseStudioContentPreview";
import { orpcClient } from "@shared/lib/orpc-client";
import type { WatermarkPlayerSettings } from "@startkiter/course";
import { reorderLesson } from "./reorder-lessons";
import { getCourseStudioErrorMessage, type CourseStudioErrorResponse } from "./studio-error-message";
import { MediaPicker, type MediaPickerValue } from "@course/components/MediaPicker";

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

interface StudioInstructorResponse {
	id: string;
	userId: string;
	user: { id: string; name: string; email: string };
}

type StudioWatermarkSetting = Omit<WatermarkPlayerSettings, "email" | "courseTitle"> & {
	id: string;
	courseId: string;
	tamperPauseEnabled: boolean;
};

const DEFAULT_WATERMARK_SETTING: Omit<StudioWatermarkSetting, "id" | "courseId"> = {
	enabled: false,
	showEmail: true,
	showCourseTitle: true,
	showTimestamp: true,
	emailDisplayMode: "FULL",
	opacityPercent: 18,
	textSize: "MD",
	movementMode: "STANDARD",
	moveIntervalSec: 12,
	tamperPauseEnabled: true,
};

interface StudioCourseResponse {
	id: string;
	title: string;
	coverImageUrl: string | null;
	chapters: Array<{
		id: string;
		courseId: string;
		title: string;
		order: number;
	lessons: StudioLessonResponse[];
	}>;
	instructors?: StudioInstructorResponse[];
	watermarkSetting?: StudioWatermarkSetting | null;
}

type StudioResponse = CourseStudioErrorResponse & {
	courses?: StudioCourseResponse[];
	isOperator?: boolean;
	folders?: StudioFolderResponse[];
	folder?: StudioFolderResponse | null;
	chapter?: StudioChapterResponse | null;
	lesson?: StudioLessonResponse | null;
	watermarkSetting?: StudioWatermarkSetting | null;
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

	// 資料夾建立 Dialog 狀態
	const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
	const [folderName, setFolderName] = useState("");

	// 章節建立 Dialog 狀態
	const [showCreateChapterDialog, setShowCreateChapterDialog] = useState(false);
	const [chapterTitle, setChapterTitle] = useState("");

	// 單元建立 Dialog 狀態
	const [showCreateLessonDialog, setShowCreateLessonDialog] = useState(false);
	const [lessonTitle, setLessonTitle] = useState("");
	const [createLessonChapterId, setCreateLessonChapterId] = useState<string | null>(null);
	const [showCreateCourseDialog, setShowCreateCourseDialog] = useState(false);
	const [courseTitle, setCourseTitle] = useState("");

	// 課綱狀態
	const [courses, setCourses] = useState<StudioCourseResponse[]>([]);
	const [isOperator, setIsOperator] = useState(false);
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
	const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
	const [selectedInstructorId, setSelectedInstructorId] = useState("");
	const selectedCourse = courses.find((course) => course.id === courseId);
	const assignedInstructors = selectedCourse?.instructors ?? [];
	const [watermarkSetting, setWatermarkSetting] = useState(DEFAULT_WATERMARK_SETTING);

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

	function selectCourse(course: StudioCourseResponse) {
		setCourseId(course.id);
		setWatermarkSetting({ ...DEFAULT_WATERMARK_SETTING, ...(course.watermarkSetting ?? {}) });
		const mappedChapters: ChapterItem[] = course.chapters.map((ch) => ({
			id: ch.id,
			title: ch.title,
			order: ch.order,
			lessons: ch.lessons.map((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				duration: lesson.videoDuration || "10:00",
				isFreePreview: lesson.isFreePreview,
				videoUrl: lesson.videoUrl || "",
				provider: lesson.videoProvider || undefined,
				content: lesson.content || "",
				aiContext: lesson.aiContext || "",
				order: lesson.order,
			})),
		}));
		setChapters(mappedChapters);
		const firstLesson = mappedChapters[0]?.lessons[0];
		setSelectedLesson(firstLesson ?? null);
		setVideoInputUrl(firstLesson?.videoUrl ?? "");
		if (firstLesson) handleVideoUrlChange(firstLesson.videoUrl);
		else setResolvedCard(null);
	}

	async function loadStudio() {
		const res = await fetch("/api/course/studio");
		const data = (await res.json()) as StudioResponse;
		if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "載入後台資料失敗");

		setIsOperator(data.isOperator === true);
		setCourses(data.courses ?? []);
		if (data.courses?.length) selectCourse(data.courses[0]);
		if (data.folders) setFolders(data.folders);
	}

	// 載入真實資料庫課綱與資料夾
	useEffect(() => {
		loadStudio().catch((e) => showMessage("error", String(e)));
	}, []);

	useEffect(() => {
		if (!isOperator) return;
		orpcClient.admin.users
			.list({ query: "", limit: 100, offset: 0 })
			.then(({ users: listedUsers }) => setUsers(listedUsers.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email,
			}))))
			.catch((error) => showMessage("error", "載入使用者清單失敗: " + String(error)));
	}, [isOperator]);

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

	function handleSelectedVideo(media: MediaPickerValue) {
		setVideoInputUrl(media.url);
		setResolvedCard({
			provider: media.provider as ProviderType,
			sourceId: media.sourceId ?? undefined,
			status: "valid",
		});
	}

	// 新增資料夾
	const handleCreateFolder = () => {
		setFolderName("");
		setShowCreateFolderDialog(true);
	};

	// 提交新增資料夾
	const handleConfirmCreateFolder = async () => {
		if (!folderName.trim()) {
			showMessage("error", "資料夾名稱不能為空");
			return;
		}
		const result = await callStudio("create_folder", { name: folderName });
		if (result.ok && result.data.folder) {
			setFolders([...folders, result.data.folder]);
			showMessage("success", "資料夾新增成功");
			setShowCreateFolderDialog(false);
			setFolderName("");
		} else {
			showMessage("error", "資料夾新增失敗");
		}
	};

	const handleConfirmCreateCourse = async () => {
		if (!courseTitle.trim()) {
			showMessage("error", "課程名稱不能為空");
			return;
		}

		const result = await callStudio("create_course", { title: courseTitle.trim() });
		if (!result.ok) {
			showMessage("error", "課程新增失敗");
			return;
		}

		setShowCreateCourseDialog(false);
		setCourseTitle("");
		await loadStudio();
		showMessage("success", "課程新增成功");
	};

	const handleAssignInstructor = async () => {
		if (!courseId || !selectedInstructorId) return;

		try {
			await orpcClient.course.assignCourseInstructor({ courseId, userId: selectedInstructorId });
			setSelectedInstructorId("");
			await loadStudio();
			showMessage("success", "講師指派成功");
		} catch (error) {
			showMessage("error", "講師指派失敗: " + String(error));
		}
	};

	const handleRemoveInstructor = async (userId: string) => {
		if (!courseId) return;

		try {
			await orpcClient.course.removeCourseInstructor({ courseId, userId });
			await loadStudio();
			showMessage("success", "講師已移除");
		} catch (error) {
			showMessage("error", "講師移除失敗: " + String(error));
		}
	};

	const handleSaveWatermark = async () => {
		if (!courseId || !isOperator) return;

		const result = await callStudio("update_watermark", {
			courseId,
			...watermarkSetting,
		});
		if (result.ok && result.data.watermarkSetting) {
			setWatermarkSetting({ ...DEFAULT_WATERMARK_SETTING, ...result.data.watermarkSetting });
			setCourses((currentCourses) =>
				currentCourses.map((course) =>
					course.id === courseId
						? { ...course, watermarkSetting: result.data.watermarkSetting ?? null }
						: course,
				),
			);
			showMessage("success", "浮水印設定已儲存");
		} else {
			showMessage("error", "浮水印設定儲存失敗");
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
	const handleCreateChapter = () => {
		if (!courseId) {
			showMessage("error", "尚未載入課程資料");
			return;
		}
		setChapterTitle("");
		setShowCreateChapterDialog(true);
	};

	// 提交新增章節
	const handleConfirmCreateChapter = async () => {
		if (!chapterTitle.trim()) {
			showMessage("error", "章節名稱不能為空");
			return;
		}
		const result = await callStudio("create_chapter", { courseId, title: chapterTitle });
		if (result.ok && result.data.chapter) {
			setChapters([...chapters, { ...result.data.chapter, lessons: [] }]);
			showMessage("success", "章節新增成功");
			setShowCreateChapterDialog(false);
			setChapterTitle("");
		} else {
			showMessage("error", "章節新增失敗");
		}
	};

	// 新增單元
	const handleCreateLesson = (chapterId: string) => {
		setLessonTitle("");
		setCreateLessonChapterId(chapterId);
		setShowCreateLessonDialog(true);
	};

	// 提交新增單元
	const handleConfirmCreateLesson = async () => {
		if (!lessonTitle.trim() || !createLessonChapterId) {
			showMessage("error", "單元名稱不能為空");
			return;
		}
		const result = await callStudio("create_lesson", { chapterId: createLessonChapterId, title: lessonTitle });
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
					c.id === createLessonChapterId ? { ...c, lessons: [...c.lessons, newL] } : c,
				),
			);
			setSelectedLesson(newL);
			setVideoInputUrl("");
			setResolvedCard(null);
			showMessage("success", "單元新增成功");
			setShowCreateLessonDialog(false);
			setLessonTitle("");
			setCreateLessonChapterId(null);
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

				{/* 課程選擇與講師指派 */}
				<Card className="flex flex-wrap items-end gap-4 p-4">
					<div className="min-w-64 flex-1 space-y-1">
						<Label htmlFor="course-selector">管理中的課程</Label>
						<select
							id="course-selector"
							aria-label="管理中的課程"
							value={courseId ?? ""}
							onChange={(event) => {
								const nextCourse = courses.find((course) => course.id === event.target.value);
								if (nextCourse) selectCourse(nextCourse);
							}}
							className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
						>
							{courses.length === 0 ? <option value="">目前沒有可管理的課程</option> : null}
							{courses.map((course) => (
								<option key={course.id} value={course.id}>
									{course.title}
								</option>
							))}
						</select>
					</div>

					{isOperator ? (
						<>
							<Button variant="outline" onClick={() => setShowCreateCourseDialog(true)}>
								新增課程
							</Button>
							<div className="min-w-72 space-y-1">
								<Label htmlFor="instructor-selector">管理講師</Label>
								<div className="flex gap-2">
									<select
										id="instructor-selector"
										aria-label="選擇講師"
										value={selectedInstructorId}
										onChange={(event) => setSelectedInstructorId(event.target.value)}
										className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
									>
										<option value="">選擇既有使用者</option>
										{users
											.filter((user) => !assignedInstructors.some((instructor) => instructor.userId === user.id))
											.map((user) => (
												<option key={user.id} value={user.id}>
													{user.name} · {user.email}
												</option>
											))}
									</select>
									<Button onClick={handleAssignInstructor} disabled={!courseId || !selectedInstructorId}>
										指派
									</Button>
								</div>
							</div>
							{assignedInstructors.length > 0 ? (
								<div className="w-full basis-full border-t border-neutral-800 pt-3 text-xs">
									<span className="mr-3 text-neutral-400">目前講師</span>
									{assignedInstructors.map((instructor) => (
										<span key={instructor.id} className="mr-2 inline-flex items-center gap-1 rounded bg-neutral-800 px-2 py-1">
											{instructor.user.name} · {instructor.user.email}
											<button
												type="button"
												className="text-rose-300 hover:text-rose-100"
												onClick={() => handleRemoveInstructor(instructor.userId)}
												aria-label={`移除 ${instructor.user.email}`}
											>
												×
											</button>
										</span>
									))}
								</div>
							) : null}
						</>
					) : null}
				</Card>

				{isOperator && courseId ? (
					<Card className="space-y-3 p-4" data-testid="course-cover-settings">
						<div>
							<h2 className="text-base font-semibold text-neutral-200">課程封面</h2>
							<p className="text-xs text-neutral-400">上傳或選擇媒體庫圖片，公開課程頁會顯示最新封面。</p>
						</div>
						<MediaPicker
							type="IMAGE"
							usageType="COURSE_COVER"
							usageId={courseId}
							value={selectedCourse?.coverImageUrl}
							onSelect={(media) => {
								setCourses((current) => current.map((course) => course.id === courseId ? { ...course, coverImageUrl: media.url } : course));
							}}
						/>
					</Card>
				) : null}

				{isOperator && courseId ? (
					<Card className="space-y-4 p-4" data-testid="watermark-settings">
						<div className="flex items-center justify-between gap-3">
							<div>
								<h2 className="text-base font-semibold text-neutral-200">影片浮水印</h2>
								<p className="text-xs text-neutral-400">播放時顯示目前學員自己的識別資訊，位置會定時移動。</p>
							</div>
							<Button variant="outline" onClick={handleSaveWatermark}>
								儲存浮水印
							</Button>
						</div>
						<div className="grid gap-4 md:grid-cols-3">
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									aria-label="啟用影片浮水印"
									checked={watermarkSetting.enabled}
									onChange={(event) =>
										setWatermarkSetting((current) => ({ ...current, enabled: event.target.checked }))
									}
								/>
								啟用浮水印
							</label>
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									aria-label="顯示學員 Email"
									checked={watermarkSetting.showEmail}
									onChange={(event) =>
										setWatermarkSetting((current) => ({ ...current, showEmail: event.target.checked }))
									}
								/>
								顯示學員 Email
							</label>
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									aria-label="顯示課程標題"
									checked={watermarkSetting.showCourseTitle}
									onChange={(event) =>
										setWatermarkSetting((current) => ({ ...current, showCourseTitle: event.target.checked }))
									}
								/>
								顯示課程標題
							</label>
						</div>
						<div className="grid gap-4 md:grid-cols-4">
							<label className="space-y-1 text-xs text-neutral-400">
								Email 顯示方式
								<select
									aria-label="Email 顯示方式"
									value={watermarkSetting.emailDisplayMode}
									onChange={(event) =>
										setWatermarkSetting((current) => ({
											...current,
											emailDisplayMode: event.target.value as "FULL" | "MASKED",
										}))
									}
									className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
								>
									<option value="FULL">完整 Email</option>
									<option value="MASKED">遮蔽 Email</option>
								</select>
							</label>
							<label className="space-y-1 text-xs text-neutral-400">
								透明度（%）
								<Input
									aria-label="浮水印透明度"
									type="number"
									min={1}
									max={100}
									value={watermarkSetting.opacityPercent}
									onChange={(event) =>
										setWatermarkSetting((current) => ({
											...current,
											opacityPercent: Number(event.target.value),
										}))
									}
								/>
							</label>
							<label className="space-y-1 text-xs text-neutral-400">
								移動間隔（秒）
								<Input
									aria-label="浮水印移動間隔"
									type="number"
									min={1}
									max={3600}
									value={watermarkSetting.moveIntervalSec}
									onChange={(event) =>
										setWatermarkSetting((current) => ({
											...current,
											moveIntervalSec: Number(event.target.value),
										}))
									}
								/>
							</label>
							<label className="space-y-1 text-xs text-neutral-400">
								移動模式
								<select
									aria-label="浮水印移動模式"
									value={watermarkSetting.movementMode}
									onChange={(event) =>
										setWatermarkSetting((current) => ({
											...current,
											movementMode: event.target.value as "STANDARD" | "CORNERS",
										}))
									}
									className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
								>
									<option value="STANDARD">標準移動</option>
									<option value="CORNERS">四角移動</option>
								</select>
							</label>
						</div>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								aria-label="顯示時間戳"
								checked={watermarkSetting.showTimestamp}
								onChange={(event) =>
									setWatermarkSetting((current) => ({ ...current, showTimestamp: event.target.checked }))
								}
							/>
							顯示時間戳
						</label>
					</Card>
				) : null}

				{/* 主工作區：三欄式 */}
			<div className="grid flex-1 grid-cols-12 gap-6 overflow-hidden">
				{/* 1. 左側：資料夾與章節單元樹 */}
				<div className="col-span-4 flex flex-col gap-4 overflow-y-auto border-r pr-4">
					{/* 資料夾分組 */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold uppercase text-neutral-400">功能群組 / 資料夾</span>
								{isOperator ? (
									<button onClick={handleCreateFolder} className="text-xs text-primary hover:underline">
										+ 新增分組
									</button>
								) : null}
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
										{isOperator ? (
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
										) : null}
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

								{selectedLesson ? (
									<MediaPicker
										type="VIDEO"
										usageType="LESSON_CONTENT"
										usageId={selectedLesson.id}
										value={videoInputUrl}
										onSelect={handleSelectedVideo}
									/>
								) : null}

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

				{/* 新增課程 Dialog */}
				<Dialog open={showCreateCourseDialog} onOpenChange={setShowCreateCourseDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>新增課程</DialogTitle>
							<DialogDescription>建立一門新的草稿課程</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<Label htmlFor="new-course-title">課程名稱</Label>
							<Input
								id="new-course-title"
								placeholder="請輸入課程名稱"
								value={courseTitle}
								onChange={(event) => setCourseTitle(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") void handleConfirmCreateCourse();
								}}
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowCreateCourseDialog(false)}>
								取消
							</Button>
							<Button onClick={handleConfirmCreateCourse}>建立課程</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* 新增資料夾 Dialog */}
				<Dialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>新增資料夾</DialogTitle>
							<DialogDescription>輸入新資料夾的名稱</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<Input
								placeholder="請輸入新資料夾名稱"
								value={folderName}
								onChange={(e) => setFolderName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleConfirmCreateFolder();
								}}
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowCreateFolderDialog(false)}>
								取消
							</Button>
							<Button onClick={handleConfirmCreateFolder}>確認</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* 新增章節 Dialog */}
				<Dialog open={showCreateChapterDialog} onOpenChange={setShowCreateChapterDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>新增章節</DialogTitle>
							<DialogDescription>輸入新章節的名稱</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<Input
								placeholder="請輸入章節名稱"
								value={chapterTitle}
								onChange={(e) => setChapterTitle(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleConfirmCreateChapter();
								}}
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowCreateChapterDialog(false)}>
								取消
							</Button>
							<Button onClick={handleConfirmCreateChapter}>確認</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* 新增單元 Dialog */}
				<Dialog open={showCreateLessonDialog} onOpenChange={setShowCreateLessonDialog}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>新增單元</DialogTitle>
							<DialogDescription>輸入新單元的名稱</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<Input
								placeholder="請輸入單元名稱"
								value={lessonTitle}
								onChange={(e) => setLessonTitle(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleConfirmCreateLesson();
								}}
								autoFocus
							/>
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowCreateLessonDialog(false)}>
								取消
							</Button>
							<Button onClick={handleConfirmCreateLesson}>確認</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
		</div>
	);
}
