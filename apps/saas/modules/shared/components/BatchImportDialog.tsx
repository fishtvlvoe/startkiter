"use client";

import { useState } from "react";
import { parseFileList, type ParsedChapter, type ParsedLesson } from "../../../../../packages/platform/src/course-batch-import/folder-parser";
import { Button } from "@startkiter/ui";

import { retryFailedLesson, type BatchLessonState } from "../lib/batch-import-state";

type LessonData = ParsedLesson & BatchLessonState & { content: string; bunnyVideoId?: string; duration?: number };
type ChapterData = Omit<ParsedChapter, "lessons"> & { lessons: LessonData[] };

export function BatchImportDialog({ courseId, onClose, onImported }: { courseId: string; onClose: () => void; onImported?: () => void }) {
	const [chapters, setChapters] = useState<ChapterData[]>([]);
	const [message, setMessage] = useState("");
	const [processing, setProcessing] = useState(false);

	function readFiles(files: FileList) {
		const parsed = parseFileList(files);
		setChapters(parsed.map((chapter) => ({
			...chapter,
			lessons: chapter.lessons.map((lesson, index) => ({ ...lesson, id: `${chapter.name}-${index}`, status: "pending", content: "" })),
		})));
		setMessage(parsed.length ? "已解析資料夾，請確認結構後開始處理。" : "找不到符合三層結構的檔案。請選擇 Course/Chapter/Lesson/檔案。 ");
	}

	async function processLesson(lessonId: string) {
		const lesson = chapters.flatMap((chapter) => chapter.lessons).find((item) => item.id === lessonId);
		if (!lesson) return { status: "error" as const, error: "LESSON_NOT_FOUND" };
		setChapters((current) => current.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map((item) => item.id === lessonId ? { ...item, status: "uploading" } : item) })));
		if (!lesson.video) return { status: "error" as const, error: "MISSING_VIDEO" };
		const form = new FormData();
		form.append("file", lesson.video);
		const upload = await fetch("/api/course/batch-import/upload-video", { method: "POST", body: form });
		if (!upload.ok) return { status: "error" as const, error: (await upload.json().catch(() => ({}))).error ?? "UPLOAD_FAILED" };
		const uploaded = await upload.json() as { bunnyVideoId: string; duration: number };
		const content = lesson.notes ? await lesson.notes.text() : "";
		setChapters((current) => current.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map((item) => item.id === lessonId ? { ...item, status: "completed", content, bunnyVideoId: uploaded.bunnyVideoId, duration: uploaded.duration } : item) })));
		return { status: "completed" as const };
	}

	async function startProcessing() {
		setProcessing(true);
		for (const lesson of chapters.flatMap((chapter) => chapter.lessons)) await processLesson(lesson.id);
		setProcessing(false);
		setMessage("處理完成。確認內容後即可匯入課程。");
	}

	async function retry(lessonId: string) {
		await retryFailedLesson(chapters.flatMap((chapter) => chapter.lessons), lessonId, processLesson);
	}

	async function confirmImport() {
		const response = await fetch("/api/course/batch-import/create-curriculum", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ courseId, confirmed: true, chapters: chapters.map((chapter) => ({ title: chapter.name, lessons: chapter.lessons.filter((lesson) => lesson.status === "completed").map((lesson) => ({ title: lesson.name, content: lesson.content, bunnyVideoId: lesson.bunnyVideoId, duration: lesson.duration })) })) }),
		});
		if (!response.ok) { setMessage("匯入失敗，請檢查失敗項目後重試。"); return; }
		onImported?.();
		onClose();
	}

	return <div role="dialog" aria-modal="true" aria-labelledby="batch-import-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
		<div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-neutral-700 bg-neutral-950 p-6 text-white shadow-xl">
			<div className="flex items-start justify-between gap-4"><div><h2 id="batch-import-title" className="text-xl font-semibold">批次匯入課程</h2><p className="text-sm text-neutral-400">僅支援 Chrome/Edge 瀏覽器。資料夾格式：課程 / 章節 / 單元 / 檔案。</p></div><button type="button" onClick={onClose} aria-label="關閉">×</button></div>
			<label htmlFor="batch-import-folder" className="mt-5 block cursor-pointer rounded-lg border border-dashed border-neutral-600 p-8 text-center text-neutral-300">拖拉資料夾到這裡，或點擊選取<input id="batch-import-folder" type="file" className="sr-only" multiple // @ts-expect-error webkitdirectory is supported by Chrome and Edge
				webkitdirectory="" onChange={(event) => { if (event.target.files) readFiles(event.target.files); }} /></label>
			{message ? <p className="mt-3 text-sm text-amber-200">{message}</p> : null}
			<div className="mt-4 space-y-3">{chapters.map((chapter, chapterIndex) => <section key={chapter.name}><input aria-label={`章節 ${chapter.name}`} className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 font-medium" value={chapter.name} onChange={(event) => setChapters((current) => current.map((item, index) => index === chapterIndex ? { ...item, name: event.target.value } : item))} />{chapter.lessons.map((lesson) => <div key={lesson.id} className="ml-4 mt-2 flex items-center justify-between rounded border border-neutral-800 p-2 text-sm"><span>{lesson.name}</span><span>{lesson.status === "error" ? <Button size="sm" variant="outline" onClick={() => retry(lesson.id)}>重試</Button> : lesson.status === "completed" ? "已完成" : lesson.status === "uploading" ? "上傳中" : "等待中"}</span></div>)}</section>)}</div>
			<div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>取消</Button><Button variant="outline" onClick={startProcessing} disabled={processing || chapters.length === 0}>開始處理</Button><Button onClick={confirmImport} disabled={processing || chapters.length === 0}>確認匯入</Button></div>
		</div>
	</div>;
}
