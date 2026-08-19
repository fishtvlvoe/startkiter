"use client";

import {
	CircleCheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	EyeIcon,
	FilePenLineIcon,
	FolderIcon,
	FolderOpenIcon,
	LoaderCircleIcon,
	PlusIcon,
	SaveIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	CourseMdxRenderer,
	FluentPlayerShell,
	type FluentVideoSource,
} from "@startkiter/course";
import { Button, Card, Input, Label, Textarea } from "@startkiter/ui";

type StudioLesson = {
	aiContext: string | null;
	content: string | null;
	id: string;
	isFreePreview: boolean;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	title: string;
	videoDuration: string | null;
	videoProvider: FluentVideoSource["provider"] | null;
	videoSource: FluentVideoSource | null;
	videoUrl: string | null;
};

type StudioChapter = {
	id: string;
	lessons: StudioLesson[];
	order: number;
	title: string;
};

type StudioCourse = {
	chapters: StudioChapter[];
	description: string | null;
	id: string;
	slug: string;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	title: string;
};

type StudioFolder = {
	id: string;
	isCollapsed: boolean;
	items: Array<{
		id: string;
		moduleId: string;
		order: number;
	}>;
	name: string;
	order: number;
};

type StudioData = {
	courses: StudioCourse[];
	folders: StudioFolder[];
};

type LessonDraft = {
	aiContext: string;
	content: string;
	isFreePreview: boolean;
	status: StudioLesson["status"];
	title: string;
	videoDuration: string;
	videoUrl: string;
};

type DeleteTarget =
	| { action: "deleteCourse"; id: string; label: string }
	| { action: "deleteChapter"; id: string; label: string }
	| { action: "deleteLesson"; id: string; label: string }
	| { action: "deleteFolder"; id: string; label: string };

const emptyData: StudioData = { courses: [], folders: [] };

function draftFromLesson(lesson: StudioLesson | undefined): LessonDraft | null {
	if (!lesson) {
		return null;
	}
	return {
		aiContext: lesson.aiContext ?? "",
		content: lesson.content ?? "",
		isFreePreview: lesson.isFreePreview,
		status: lesson.status,
		title: lesson.title,
		videoDuration: lesson.videoDuration ?? "",
		videoUrl: lesson.videoUrl ?? "",
	};
}

function formatDuration(seconds: number) {
	const total = Math.round(seconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const remainder = total % 60;
	return hours > 0
		? [hours, minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":")
		: [minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":");
}

export function CourseStudioClient() {
	const [data, setData] = useState<StudioData>(emptyData);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
	const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
	const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null);
	const [newCourseTitle, setNewCourseTitle] = useState("");
	const [newChapterTitle, setNewChapterTitle] = useState("");
	const [newLessonTitle, setNewLessonTitle] = useState("");
	const [newFolderName, setNewFolderName] = useState("");
	const [courseTitleDraft, setCourseTitleDraft] = useState("");
	const [folderBeingRenamed, setFolderBeingRenamed] = useState<string | null>(null);
	const [folderName, setFolderName] = useState("");
	const [chapterBeingRenamed, setChapterBeingRenamed] = useState<string | null>(null);
	const [chapterTitle, setChapterTitle] = useState("");
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
	const [resolvedVideo, setResolvedVideo] = useState<FluentVideoSource | null>(null);

	const reload = async () => {
		const response = await fetch("/api/course/studio", { cache: "no-store" });
		const body = (await response.json()) as StudioData & { error?: string };
		if (!response.ok) {
			throw new Error(body.error ?? "無法讀取 Course Studio 資料。");
		}
		setData({ courses: body.courses, folders: body.folders });
		setSelectedCourseId((current) =>
			body.courses.some((course) => course.id === current) ? current : (body.courses[0]?.id ?? null),
		);
		setSelectedLessonId((current) => {
			const lessonIds = body.courses.flatMap((course) =>
				course.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id)),
			);
			return lessonIds.includes(current ?? "") ? current : (lessonIds[0] ?? null);
		});
	};

	useEffect(() => {
		void reload()
			.catch((reason: unknown) =>
				setError(reason instanceof Error ? reason.message : "無法讀取 Course Studio 資料。"),
			)
			.finally(() => setIsLoading(false));
	}, []);

	const selectedCourse = useMemo(
		() => data.courses.find((course) => course.id === selectedCourseId) ?? null,
		[data.courses, selectedCourseId],
	);
	const selectedLesson = useMemo(
		() =>
			data.courses
				.flatMap((course) => course.chapters)
				.flatMap((chapter) => chapter.lessons)
				.find((lesson) => lesson.id === selectedLessonId),
		[data.courses, selectedLessonId],
	);
	const selectedLessonChapter = useMemo(
		() =>
			data.courses
				.flatMap((course) => course.chapters)
				.find((chapter) => chapter.lessons.some((lesson) => lesson.id === selectedLessonId)) ?? null,
		[data.courses, selectedLessonId],
	);

	useEffect(() => {
		setCourseTitleDraft(selectedCourse?.title ?? "");
	}, [selectedCourse?.id, selectedCourse?.title]);

	useEffect(() => {
		setLessonDraft(draftFromLesson(selectedLesson));
		setResolvedVideo(selectedLesson?.videoSource ?? null);
	}, [selectedLesson]);

	const sendCommand = async (command: Record<string, unknown>) => {
		setError(null);
		const action = String(command.action);
		const method = action.startsWith("create")
			? "POST"
			: action.startsWith("delete")
				? "DELETE"
				: "PATCH";
		const response = await fetch("/api/course/studio", {
			body: JSON.stringify(command),
			headers: { "content-type": "application/json" },
			method,
		});
		const body = (await response.json()) as { error?: string };
		if (!response.ok) {
			throw new Error(body.error ?? "無法儲存 Course Studio 變更。");
		}
		await reload();
	};

	const run = (command: Record<string, unknown>) => {
		void sendCommand(command).catch((reason: unknown) =>
			setError(reason instanceof Error ? reason.message : "無法儲存 Course Studio 變更。"),
		);
	};

	const reorderChapters = (index: number, direction: -1 | 1) => {
		if (!selectedCourse) {
			return;
		}
		const orderedChapterIds = selectedCourse.chapters.map((chapter) => chapter.id);
		const targetIndex = index + direction;
		if (targetIndex < 0 || targetIndex >= orderedChapterIds.length) {
			return;
		}
		[orderedChapterIds[index], orderedChapterIds[targetIndex]] = [
			orderedChapterIds[targetIndex]!,
			orderedChapterIds[index]!,
		];
		run({ action: "reorderChapters", courseId: selectedCourse.id, orderedChapterIds });
	};

	const reorderFolders = (index: number, direction: -1 | 1) => {
		const orderedFolderIds = data.folders.map((folder) => folder.id);
		const targetIndex = index + direction;
		if (targetIndex < 0 || targetIndex >= orderedFolderIds.length) {
			return;
		}
		[orderedFolderIds[index], orderedFolderIds[targetIndex]] = [
			orderedFolderIds[targetIndex]!,
			orderedFolderIds[index]!,
		];
		run({ action: "reorderFolders", orderedFolderIds });
	};

	const saveLesson = () => {
		if (!selectedLesson || !lessonDraft) {
			return;
		}
		run({
			action: "updateLesson",
			aiContext: lessonDraft.aiContext || null,
			content: lessonDraft.content || null,
			id: selectedLesson.id,
			isFreePreview: lessonDraft.isFreePreview,
			status: lessonDraft.status,
			title: lessonDraft.title,
			videoDuration: lessonDraft.videoDuration || null,
			videoUrl: lessonDraft.videoUrl || null,
		});
	};

	const validateVideo = async () => {
		if (!lessonDraft?.videoUrl.trim()) {
			return;
		}
		setError(null);
		const response = await fetch("/api/course/studio", {
			body: JSON.stringify({ action: "resolveVideo", videoUrl: lessonDraft.videoUrl }),
			headers: { "content-type": "application/json" },
			method: "POST",
		});
		const body = (await response.json()) as { error?: string; result?: FluentVideoSource };
		if (!response.ok || !body.result) {
			throw new Error(body.error ?? "影音網址未通過驗證。");
		}
		setResolvedVideo(body.result);
	};

	const previewSource =
		resolvedVideo?.url === lessonDraft?.videoUrl
			? resolvedVideo
			: selectedLesson?.videoUrl === lessonDraft?.videoUrl
				? selectedLesson?.videoSource ?? null
				: null;

	return (
		<div className="space-y-6">
			<header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
				<div>
					<h1 className="text-2xl font-bold">電馭學院 Course Studio</h1>
					<p className="text-muted-foreground text-sm">所有課綱、媒體與資料夾變更都會直接寫入資料庫。</p>
				</div>
				{isLoading ? <LoaderCircleIcon aria-label="載入中" className="size-5 animate-spin" /> : null}
			</header>

			{error ? <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200" role="alert">{error}</p> : null}

			<div className="grid gap-5 xl:grid-cols-[270px_320px_minmax(0,1fr)]">
				<Card className="space-y-4 p-4">
					<div>
						<h2 className="font-semibold">Studio 資料夾</h2>
						<p className="text-muted-foreground text-xs">收折偏好只屬於目前 operator。</p>
					</div>
					<div className="flex gap-2">
						<Input
							aria-label="新資料夾名稱"
							onChange={(event) => setNewFolderName(event.target.value)}
							placeholder="新增資料夾"
							value={newFolderName}
						/>
						<Button
							aria-label="新增資料夾"
							disabled={!newFolderName.trim()}
							onClick={() => {
								run({ action: "createFolder", name: newFolderName });
								setNewFolderName("");
							}}
							size="icon"
						>
							<PlusIcon className="size-4" />
						</Button>
					</div>
					<ul className="space-y-1">
						{data.folders.map((folder, index) => (
							<li className="rounded-md border border-border p-2" key={folder.id}>
								<div className="flex items-center gap-1">
									<Button
										aria-label={folder.isCollapsed ? "展開 " + folder.name : "收折 " + folder.name}
										onClick={() =>
											run({
												action: "setFolderCollapsed",
												folderId: folder.id,
												isCollapsed: !folder.isCollapsed,
											})
										}
										size="icon"
										title={folder.isCollapsed ? "展開資料夾" : "收折資料夾"}
										variant="ghost"
									>
										{folder.isCollapsed ? <FolderIcon className="size-4" /> : <FolderOpenIcon className="size-4" />}
									</Button>
									{folderBeingRenamed === folder.id ? (
										<Input
											autoFocus
											onChange={(event) => setFolderName(event.target.value)}
											onKeyDown={(event) => {
												if (event.key === "Enter" && folderName.trim()) {
													run({ action: "renameFolder", id: folder.id, name: folderName });
													setFolderBeingRenamed(null);
												}
											}}
											value={folderName}
										/>
									) : (
										<span className="min-w-0 flex-1 truncate text-sm">{folder.name}</span>
									)}
									<Button
										aria-label="重新命名資料夾"
										onClick={() => {
											setFolderBeingRenamed(folder.id);
											setFolderName(folder.name);
										}}
										size="icon"
										title="重新命名資料夾"
										variant="ghost"
									>
										<FilePenLineIcon className="size-3.5" />
									</Button>
									<Button
										aria-label="刪除資料夾"
										onClick={() => setDeleteTarget({ action: "deleteFolder", id: folder.id, label: folder.name })}
										size="icon"
										title="刪除資料夾"
										variant="ghost"
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								</div>
								{!folder.isCollapsed ? (
									<div className="mt-2 space-y-2 border-t border-border pt-2">
										{folder.items.map((item) => (
											<div className="flex items-center gap-2 text-xs" key={item.id}>
												<span className="min-w-0 flex-1 truncate">{item.moduleId === "course" ? "電馭學院 module" : item.moduleId}</span>
												<select
													aria-label={"移動 " + item.moduleId + " 到資料夾"}
													className="max-w-32 rounded border bg-background p-1 text-xs"
													defaultValue={folder.id}
													onChange={(event) => {
														if (event.target.value !== folder.id) {
															run({ action: "moveFolderItem", id: item.id, toFolderId: event.target.value });
														}
													}}
												>
													{data.folders.map((target) => (
														<option key={target.id} value={target.id}>{target.name}</option>
													))}
												</select>
											</div>
										))}
										{folder.items.length === 0 ? <p className="text-xs text-muted-foreground">尚未放入 module。</p> : null}
									</div>
								) : null}
								<div className="mt-1 flex justify-end gap-1">
									<Button aria-label="資料夾上移" onClick={() => reorderFolders(index, -1)} size="icon" title="上移資料夾" variant="ghost">
										<ChevronUpIcon className="size-3.5" />
									</Button>
									<Button aria-label="資料夾下移" onClick={() => reorderFolders(index, 1)} size="icon" title="下移資料夾" variant="ghost">
										<ChevronDownIcon className="size-3.5" />
									</Button>
								</div>
							</li>
						))}
					</ul>
				</Card>

				<Card className="space-y-4 p-4">
					<div className="flex items-center justify-between">
						<h2 className="font-semibold">課程與章節</h2>
						<Button
							aria-label="新增課程"
							disabled={!newCourseTitle.trim()}
							onClick={() => {
								run({ action: "createCourse", title: newCourseTitle });
								setNewCourseTitle("");
							}}
							size="icon"
							title="新增課程"
						>
							<PlusIcon className="size-4" />
						</Button>
					</div>
					<Input
						aria-label="新課程名稱"
						onChange={(event) => setNewCourseTitle(event.target.value)}
						placeholder="新課程名稱"
						value={newCourseTitle}
					/>
					<select
						aria-label="選擇課程"
						className="w-full rounded-md border bg-background p-2 text-sm"
						onChange={(event) => setSelectedCourseId(event.target.value)}
						value={selectedCourse?.id ?? ""}
					>
						<option value="">選擇課程</option>
						{data.courses.map((course) => (
							<option key={course.id} value={course.id}>{course.title}</option>
						))}
					</select>
					{selectedCourse ? (
						<>
							<div className="space-y-2 rounded-md bg-muted p-2 text-xs">
								<div className="flex items-center gap-2">
									<Input
										aria-label="課程名稱"
										onChange={(event) => setCourseTitleDraft(event.target.value)}
										value={courseTitleDraft}
									/>
									<Button
										disabled={!courseTitleDraft.trim() || courseTitleDraft === selectedCourse.title}
										onClick={() => run({ action: "updateCourse", id: selectedCourse.id, title: courseTitleDraft })}
										size="sm"
										variant="outline"
									>
										<SaveIcon className="mr-1 size-3.5" />
										改名
									</Button>
								</div>
								<div className="flex items-center justify-between gap-2">
									<span>{selectedCourse.status === "PUBLISHED" ? "已發布" : "草稿"}</span>
								<Button
									onClick={() =>
										run({
											action: "updateCourse",
											id: selectedCourse.id,
											status: selectedCourse.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
										})
									}
									size="sm"
									variant="outline"
								>
									{selectedCourse.status === "PUBLISHED" ? "轉為草稿" : "發布課程"}
								</Button>
									<Button
										aria-label="刪除課程"
										onClick={() => setDeleteTarget({ action: "deleteCourse", id: selectedCourse.id, label: selectedCourse.title })}
										size="icon"
										title="刪除課程"
										variant="ghost"
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								</div>
							</div>
							<div className="flex gap-2">
								<Input
									aria-label="新章節名稱"
									onChange={(event) => setNewChapterTitle(event.target.value)}
									placeholder="新增章節"
									value={newChapterTitle}
								/>
								<Button
									aria-label="新增章節"
									disabled={!newChapterTitle.trim()}
									onClick={() => {
										run({ action: "createChapter", courseId: selectedCourse.id, title: newChapterTitle });
										setNewChapterTitle("");
									}}
									size="icon"
								>
									<PlusIcon className="size-4" />
								</Button>
							</div>
							<div className="space-y-2">
								{selectedCourse.chapters.map((chapter, index) => (
									<section
										className="rounded-md border p-2"
										key={chapter.id}
										onDragOver={(event) => event.preventDefault()}
										onDrop={(event) => {
											const lessonId = event.dataTransfer.getData("application/x-startkiter-lesson");
											if (lessonId) {
												run({ action: "moveLesson", id: lessonId, toChapterId: chapter.id });
											}
										}}
									>
										<div className="flex items-center gap-1">
											{chapterBeingRenamed === chapter.id ? (
												<Input
													autoFocus
													className="min-w-0 flex-1"
													onChange={(event) => setChapterTitle(event.target.value)}
													onKeyDown={(event) => {
														if (event.key === "Enter" && chapterTitle.trim()) {
															run({ action: "updateChapter", id: chapter.id, title: chapterTitle });
															setChapterBeingRenamed(null);
														}
													}}
													value={chapterTitle}
												/>
											) : (
												<strong className="min-w-0 flex-1 truncate text-sm">{chapter.title}</strong>
											)}
											<Button
												aria-label="重新命名章節"
												onClick={() => {
													setChapterBeingRenamed(chapter.id);
													setChapterTitle(chapter.title);
												}}
												size="icon"
												title="重新命名章節"
												variant="ghost"
											>
												<FilePenLineIcon className="size-3.5" />
											</Button>
											<Button aria-label="章節上移" onClick={() => reorderChapters(index, -1)} size="icon" title="上移章節" variant="ghost">
												<ChevronUpIcon className="size-3.5" />
											</Button>
											<Button aria-label="章節下移" onClick={() => reorderChapters(index, 1)} size="icon" title="下移章節" variant="ghost">
												<ChevronDownIcon className="size-3.5" />
											</Button>
											<Button
												aria-label="刪除章節"
												onClick={() => setDeleteTarget({ action: "deleteChapter", id: chapter.id, label: chapter.title })}
												size="icon"
												title="刪除章節"
												variant="ghost"
											>
												<Trash2Icon className="size-3.5" />
											</Button>
										</div>
										<div className="mt-2 space-y-1">
											{chapter.lessons.map((lesson) => (
												<div
													className="flex items-center gap-1 rounded px-1 hover:bg-muted"
													draggable
													key={lesson.id}
													onDragStart={(event) => event.dataTransfer.setData("application/x-startkiter-lesson", lesson.id)}
													onDragOver={(event) => event.preventDefault()}
													onDrop={(event) => {
														event.preventDefault();
														event.stopPropagation();
														const lessonId = event.dataTransfer.getData("application/x-startkiter-lesson");
														if (lessonId && lessonId !== lesson.id) {
															run({ action: "moveLesson", beforeLessonId: lesson.id, id: lessonId, toChapterId: chapter.id });
														}
													}}
												>
													<button
														aria-pressed={lesson.id === selectedLessonId}
														className="min-w-0 flex-1 rounded px-1 py-1.5 text-left text-xs aria-pressed:bg-primary/15"
														onClick={() => setSelectedLessonId(lesson.id)}
														type="button"
													>
														{lesson.title}
													</button>
													<Button aria-label={"編輯 " + lesson.title} onClick={() => setSelectedLessonId(lesson.id)} size="icon" title="編輯單元" variant="ghost">
														<FilePenLineIcon className="size-3.5" />
													</Button>
													<Button aria-label={"預覽 " + lesson.title} onClick={() => setSelectedLessonId(lesson.id)} size="icon" title="預覽已儲存內容" variant="ghost">
														<EyeIcon className="size-3.5" />
													</Button>
													<Button aria-label={"刪除 " + lesson.title} onClick={() => setDeleteTarget({ action: "deleteLesson", id: lesson.id, label: lesson.title })} size="icon" title="刪除單元" variant="ghost">
														<Trash2Icon className="size-3.5" />
													</Button>
												</div>
											))}
										</div>
										<div className="mt-2 flex gap-2">
											<Input
												aria-label={chapter.title + " 新單元名稱"}
												onChange={(event) => setNewLessonTitle(event.target.value)}
												placeholder="新增單元"
												value={newLessonTitle}
											/>
											<Button
												aria-label="新增單元"
												disabled={!newLessonTitle.trim()}
												onClick={() => {
													run({ action: "createLesson", chapterId: chapter.id, title: newLessonTitle });
													setNewLessonTitle("");
												}}
												size="icon"
											>
												<PlusIcon className="size-4" />
											</Button>
										</div>
									</section>
								))}
							</div>
						</>
					) : <p className="text-muted-foreground text-sm">建立或選擇課程後可管理章節與單元。</p>}
				</Card>

				<Card className="space-y-5 p-5">
					{selectedLesson && lessonDraft ? (
						<>
							<div className="flex items-center justify-between gap-3">
								<div>
									<h2 className="font-semibold">單元編輯</h2>
									<p className="text-muted-foreground text-xs">儲存後才會更新預覽與學員端。</p>
								</div>
								<div className="flex gap-2">
									<Button
										aria-label="刪除單元"
										onClick={() => setDeleteTarget({ action: "deleteLesson", id: selectedLesson.id, label: selectedLesson.title })}
										size="icon"
										title="刪除單元"
										variant="outline"
									>
										<Trash2Icon className="size-4" />
									</Button>
									<Button onClick={saveLesson} size="sm">
										<SaveIcon className="mr-1.5 size-4" />
										儲存
									</Button>
								</div>
							</div>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-1">
									<Label htmlFor="studio-lesson-title">單元名稱</Label>
									<Input id="studio-lesson-title" onChange={(event) => setLessonDraft({ ...lessonDraft, title: event.target.value })} value={lessonDraft.title} />
								</div>
								<div className="space-y-1">
									<Label htmlFor="studio-lesson-status">發布狀態</Label>
									<select
										className="w-full rounded-md border bg-background p-2 text-sm"
										id="studio-lesson-status"
										onChange={(event) => setLessonDraft({ ...lessonDraft, status: event.target.value as LessonDraft["status"] })}
										value={lessonDraft.status}
									>
										<option value="DRAFT">草稿</option>
										<option value="PUBLISHED">發布</option>
										<option value="ARCHIVED">封存</option>
									</select>
								</div>
							</div>
							<label className="flex items-center gap-2 text-sm" htmlFor="studio-free-preview">
								<input
									checked={lessonDraft.isFreePreview}
									id="studio-free-preview"
									onChange={(event) => setLessonDraft({ ...lessonDraft, isFreePreview: event.target.checked })}
									type="checkbox"
								/>
								設為已發布試看
							</label>
							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-1">
									<Label htmlFor="studio-video-url">影片網址</Label>
									<Input
										id="studio-video-url"
										onChange={(event) => {
											setLessonDraft({ ...lessonDraft, videoDuration: "", videoUrl: event.target.value });
											setResolvedVideo(null);
										}}
										placeholder="https://…"
										value={lessonDraft.videoUrl}
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="studio-video-duration">播放器回讀的已驗證時長</Label>
									<Input id="studio-video-duration" placeholder="先驗證影音來源並載入預覽" readOnly value={lessonDraft.videoDuration} />
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
								<Button
									disabled={!lessonDraft.videoUrl.trim()}
									onClick={() => void validateVideo().catch((reason: unknown) =>
										setError(reason instanceof Error ? reason.message : "影音網址未通過驗證。"),
									)}
									size="sm"
									variant="outline"
								>
									<EyeIcon className="mr-1.5 size-4" />
									驗證影音來源
								</Button>
								{resolvedVideo ? (
									<div className="flex min-w-0 items-center gap-2 text-xs">
										<CircleCheckIcon aria-hidden="true" className="size-4 shrink-0 text-emerald-600" />
										<span>
											已驗證 {resolvedVideo.provider}
											{resolvedVideo.sourceId ? " · " + resolvedVideo.sourceId : ""}
											{lessonDraft.videoDuration ? " · 時長 " + lessonDraft.videoDuration : " · 等待播放器回讀時長"}
											 · Fluent Player Shell 相容
										</span>
									</div>
								) : <span className="text-xs text-muted-foreground">尚未驗證目前輸入的影音網址。</span>}
							</div>
							<div className="space-y-1">
								<Label htmlFor="studio-lesson-content">受限 MDX 講義</Label>
								<Textarea
									className="min-h-48 font-mono text-xs"
									id="studio-lesson-content"
									onChange={(event) => setLessonDraft({ ...lessonDraft, content: event.target.value })}
									value={lessonDraft.content}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="studio-ai-context">本節 AI context</Label>
								<Textarea
									id="studio-ai-context"
									onChange={(event) => setLessonDraft({ ...lessonDraft, aiContext: event.target.value })}
									value={lessonDraft.aiContext}
								/>
							</div>
							<div className="space-y-2 border-t pt-4">
								<div className="flex items-center gap-2">
									<EyeIcon className="size-4" />
									<h3 className="text-sm font-semibold">已儲存內容預覽</h3>
								</div>
								<FluentPlayerShell
									onDurationChange={(seconds) => {
										if (resolvedVideo?.url !== lessonDraft.videoUrl) {
											return;
										}
										setLessonDraft((current) => current ? { ...current, videoDuration: formatDuration(seconds) } : current);
									}}
									source={previewSource}
									title={selectedLesson.title}
								/>
								<CourseMdxRenderer content={selectedLesson.content} currentTime={0} />
							</div>
							{selectedLessonChapter && selectedCourse ? (
								<div className="flex flex-wrap items-center gap-2 border-t pt-4">
									<span className="text-sm">移動單元到</span>
									<select
										className="rounded-md border bg-background p-2 text-sm"
										defaultValue={selectedLessonChapter.id}
										onChange={(event) => {
											if (event.target.value !== selectedLessonChapter.id) {
												run({ action: "moveLesson", id: selectedLesson.id, toChapterId: event.target.value });
											}
										}}
									>
										{selectedCourse.chapters.map((chapter) => (
											<option key={chapter.id} value={chapter.id}>{chapter.title}</option>
										))}
									</select>
								</div>
							) : null}
						</>
					) : <p className="text-muted-foreground text-sm">選擇一個單元後可編輯並持久化。</p>}
				</Card>
			</div>

			{deleteTarget ? (
				<div aria-labelledby="course-studio-delete-title" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog">
					<Card className="w-full max-w-md space-y-4 p-5">
						<div className="flex items-center justify-between">
							<h2 id="course-studio-delete-title" className="font-semibold">確認刪除</h2>
							<Button aria-label="關閉刪除確認" onClick={() => setDeleteTarget(null)} size="icon" title="關閉" variant="ghost">
								<XIcon className="size-4" />
							</Button>
						</div>
						<p className="text-sm">確定刪除「{deleteTarget.label}」？此操作會同步刪除其子資料。</p>
						<div className="flex justify-end gap-2">
							<Button onClick={() => setDeleteTarget(null)} variant="outline">取消</Button>
							<Button
								onClick={() => {
									run({ action: deleteTarget.action, id: deleteTarget.id });
									setDeleteTarget(null);
								}}
								variant="destructive"
							>
								刪除
							</Button>
						</div>
					</Card>
				</div>
			) : null}
		</div>
	);
}
