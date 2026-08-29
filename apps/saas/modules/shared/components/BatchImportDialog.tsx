"use client";

import { useRef, useState } from "react";
import { generateBatchLessonContent, parseFileList, runWithConcurrency, type ParsedChapter, type ParsedLesson } from "@startkiter/platform";
import { Button } from "@startkiter/ui";

import { formatImportFailures, retryFailedLesson, type BatchLessonState } from "../lib/batch-import-state";

type LessonData = ParsedLesson & BatchLessonState & { content: string; bunnyVideoId?: string; duration?: number; enabled: boolean };
type ChapterData = Omit<ParsedChapter, "lessons"> & { lessons: LessonData[] };

export function BatchImportDialog({ courseId, onClose, onImported }: { courseId: string; onClose: () => void; onImported?: () => void }) {
	const [chapters, setChapters] = useState<ChapterData[]>([]);
	const [message, setMessage] = useState("");
	const [processing, setProcessing] = useState(false);
	const uploadQueue = useRef(Promise.resolve());

	function readFiles(files: FileList) {
		const parsed = parseFileList(files);
		setChapters(parsed.map((chapter) => ({
			...chapter,
		lessons: chapter.lessons.map((lesson, index) => ({ ...lesson, id: `${chapter.name}-${index}`, status: "pending", content: "", enabled: true })),
		})));
		setMessage(parsed.length ? "已解析資料夾，請確認結構後開始處理。" : "找不到符合三層結構的檔案。請選擇 Course/Chapter/Lesson/檔案。 ");
	}

	async function processLesson(lessonId: string) {
		const chapter = chapters.find((item) => item.lessons.some((lesson) => lesson.id === lessonId));
		const lesson = chapter?.lessons.find((item) => item.id === lessonId);
		if (!lesson || !chapter) return { status: "error" as const, error: "LESSON_NOT_FOUND" };
		setChapters((current) => current.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map((item) => item.id === lessonId ? { ...item, status: "uploading" } : item) })));
		try {
			if (!lesson.video) throw new Error("MISSING_VIDEO");
			const form = new FormData();
			form.append("file", lesson.video);
			form.append("courseId", courseId);
			const uploadRequest = uploadQueue.current.then(async () => {
				const upload = await fetch("/api/course/batch-import/upload-video", { method: "POST", body: form });
				if (!upload.ok) throw new Error((await upload.json().catch(() => ({}))).error ?? "UPLOAD_FAILED");
				return await upload.json() as { bunnyVideoId: string; duration: number };
			});
			uploadQueue.current = uploadRequest.then(() => undefined, () => undefined);
			const uploaded = await uploadRequest;
			let content = "";
			if (lesson.notes) {
				content = await lesson.notes.text();
			} else if (lesson.subtitle) {
				setChapters((current) => current.map((item) => ({ ...item, lessons: item.lessons.map((entry) => entry.id === lessonId ? { ...entry, status: "generating" } : entry) })));
				content = await generateBatchLessonContent({ chapterTitle: chapter.name, lessonTitle: lesson.name, subtitle: lesson.subtitle }, async ({ chapterTitle, lessonTitle, srtContent }) => {
					const response = await fetch("/api/course/ai-notes/generate", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ courseId, chapterTitle, lessonTitle, srtContent }),
					});
					if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? "GENERATION_FAILED");
					if (!response.body) throw new Error("GENERATION_EMPTY");
					const reader = response.body.getReader();
					const decoder = new TextDecoder();
					let generated = "";
					while (true) {
						const chunk = await reader.read();
						if (chunk.done) break;
						generated += decoder.decode(chunk.value, { stream: true });
					}
					if (!generated.trim()) throw new Error("GENERATION_EMPTY");
					return generated;
				});
			}
			setChapters((current) => current.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map((item) => item.id === lessonId ? { ...item, status: "completed", content, bunnyVideoId: uploaded.bunnyVideoId, duration: uploaded.duration } : item) })));
			return { status: "completed" as const };
		} catch (error) {
			const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
			setChapters((current) => current.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map((item) => item.id === lessonId ? { ...item, status: "error", error: code } : item) })));
			return { status: "error" as const, error: code };
		}
	}

	async function startProcessing() {
		setProcessing(true);
		await runWithConcurrency(chapters.flatMap((chapter) => chapter.lessons), 5, async (lesson) => processLesson(lesson.id));
		setProcessing(false);
		setMessage("處理完成。確認內容後即可匯入課程。");
	}

	async function retry(lessonId: string) {
		const states = chapters.flatMap((chapter) => chapter.lessons);
		const updated = await retryFailedLesson(states, lessonId, processLesson);
		setChapters((current) => current.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map((lesson) => ({ ...lesson, ...(updated.find((item) => item.id === lesson.id) ?? {}) })) })));
	}

	async function confirmImport() {
		const response = await fetch("/api/course/batch-import/create-curriculum", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ courseId, confirmed: true, chapters: chapters.map((chapter) => ({ title: chapter.name, lessons: chapter.lessons.filter((lesson) => lesson.enabled && lesson.status === "completed").map((lesson) => ({ title: lesson.name, content: lesson.content, bunnyVideoId: lesson.bunnyVideoId, duration: lesson.duration })) })) }),
		});
		if (response.status === 207) {
			const result = await response.json().catch(() => ({ failures: [] })) as { failures?: Array<{ lessonTitle: string }> };
			setMessage(formatImportFailures(result.failures ?? []));
			return;
		}
		if (!response.ok) { setMessage("匯入失敗，請檢查失敗項目後重試。"); return; }
		onImported?.();
		onClose();
	}

	return <div role="dialog" aria-modal="true" aria-labelledby="batch-import-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
		<div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-neutral-700 bg-neutral-950 p-6 text-white shadow-xl">
			<div className="flex items-start justify-between gap-4"><div><h2 id="batch-import-title" className="text-xl font-semibold">批次匯入課程</h2><p className="text-sm text-neutral-400">僅支援 Chrome/Edge 瀏覽器。資料夾格式：課程 / 章節 / 單元 / 檔案。</p></div><button type="button" onClick={onClose} aria-label="關閉">×</button></div>
			<label htmlFor="batch-import-folder" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (event.dataTransfer.files.length) readFiles(event.dataTransfer.files); }} className="mt-5 block cursor-pointer rounded-lg border border-dashed border-neutral-600 p-8 text-center text-neutral-300">拖拉資料夾到這裡，或點擊選取<input id="batch-import-folder" type="file" className="sr-only" multiple // @ts-expect-error webkitdirectory is supported by Chrome and Edge
				webkitdirectory="" onChange={(event) => { if (event.target.files) readFiles(event.target.files); }} /></label>
			{message ? <p className="mt-3 text-sm text-amber-200">{message}</p> : null}
			<div className="mt-4 space-y-3">{chapters.map((chapter, chapterIndex) => <section key={chapter.name}><input aria-label={`章節 ${chapter.name}`} className="w-full rounded border border-neutral-700 bg-neutral-900 p-2 font-medium" value={chapter.name} onChange={(event) => setChapters((current) => current.map((item, index) => index === chapterIndex ? { ...item, name: event.target.value } : item))} />{chapter.lessons.map((lesson) => <div key={lesson.id} className="ml-4 rounded border border-neutral-800 p-2 text-sm"><div className="flex items-center justify-between gap-2"><input aria-label={`單元 ${lesson.name}`} className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-900 p-1" value={lesson.name} onChange={(event) => setChapters((current) => current.map((item) => ({ ...item, lessons: item.lessons.map((entry) => entry.id === lesson.id ? { ...entry, name: event.target.value } : entry) })))} /><label className="flex items-center gap-1"><input type="checkbox" checked={lesson.enabled} onChange={(event) => setChapters((current) => current.map((item) => ({ ...item, lessons: item.lessons.map((entry) => entry.id === lesson.id ? { ...entry, enabled: event.target.checked } : entry) })))} />啟用</label><span>{lesson.status === "error" ? <span className="flex items-center gap-2"><span>失敗：{lesson.error ?? "UPLOAD_FAILED"}</span><Button size="sm" variant="outline" onClick={() => retry(lesson.id)}>重試</Button></span> : lesson.status === "completed" ? "已完成" : lesson.status === "generating" ? "生成中" : lesson.status === "uploading" ? "上傳中" : "等待中"}</span></div>{lesson.warnings.map((warning) => <span key={warning} className="mr-2 mt-1 inline-block rounded bg-amber-900/60 px-2 py-1 text-xs text-amber-200">{warning === "MISSING_VIDEO" ? "缺少影片" : "缺少字幕/講義"}</span>)}</div>)}</section>)}</div>
			<div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>取消</Button><Button variant="outline" onClick={startProcessing} disabled={processing || chapters.length === 0}>開始處理</Button><Button onClick={confirmImport} disabled={processing || chapters.length === 0}>確認匯入</Button></div>
		</div>
	</div>;
}
