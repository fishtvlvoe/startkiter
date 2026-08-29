"use client";

import { useEffect, useState } from "react";

type AiNotesDialogProps = {
	open: boolean;
	lessonId: string;
	chapterTitle: string;
	lessonTitle: string;
	initialDraft?: string;
	onOpenChange: (open: boolean) => void;
	onSaved?: (lesson: { title: string; content: string }) => void;
};

export function AiNotesDialog({
	open,
	lessonId,
	chapterTitle,
	lessonTitle: initialLessonTitle,
	initialDraft = "",
	onOpenChange,
	onSaved,
}: AiNotesDialogProps) {
	const [title, setTitle] = useState(initialLessonTitle);
	const [content, setContent] = useState(initialDraft);
	const [status, setStatus] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (open) {
			setTitle(initialLessonTitle);
			setContent(initialDraft);
			setStatus("");
		}
	}, [initialDraft, initialLessonTitle, open]);

	if (!open) return null;

	async function generate(file: File) {
		setBusy(true);
		setStatus("生成中…");
		try {
			const response = await fetch("/api/course/ai-notes/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					lessonId,
					chapterTitle,
					lessonTitle: title,
					srtContent: await file.text(),
				}),
			});
			if (!response.ok) {
				const error = (await response.json().catch(() => ({}))) as { error?: string };
				setStatus(error.error === "GEMINI_KEY_MISSING" ? "請先設定 API Key" : error.error ?? "生成失敗");
				return;
			}
			if (!response.body) {
				setStatus("生成失敗：沒有收到串流內容");
				return;
			}
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let draft = "";
			while (true) {
				const chunk = await reader.read();
				if (chunk.done) break;
				draft += decoder.decode(chunk.value, { stream: true });
				setContent(draft);
			}
			setStatus("生成完成，可編輯後存檔");
		} catch (error) {
			setStatus(`生成失敗：${error instanceof Error ? error.message : "未知錯誤"}`);
		} finally {
			setBusy(false);
		}
	}

	async function save() {
		setBusy(true);
		setStatus("儲存中…");
		try {
			const response = await fetch("/api/course/studio", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "update_lesson",
					payload: { id: lessonId, title, content },
				}),
			});
			if (!response.ok) throw new Error("講義儲存失敗");
			onSaved?.({ title, content });
			onOpenChange(false);
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "講義儲存失敗");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div role="dialog" aria-modal="true" aria-labelledby="ai-notes-title" className="space-y-4 rounded-lg border bg-background p-6">
			<div>
				<h2 id="ai-notes-title" className="text-lg font-semibold">AI 生成講義</h2>
				<p className="text-sm text-muted-foreground">生成內容是草稿，確認後才會寫入單元。</p>
				<a href="/admin/settings/gemini" className="text-sm underline">尚未設定 API Key？前往設定</a>
			</div>
			<label className="grid gap-2">標題<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
			<label className="grid gap-2">上傳字幕<input type="file" accept=".srt" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void generate(file); }} /></label>
			<label className="grid gap-2">講義內容<textarea name="content" rows={16} value={content} onChange={(event) => setContent(event.target.value)} /></label>
			{status && <p role="status">{status}</p>}
			<div className="flex justify-end gap-2">
				<button type="button" data-action="cancel" disabled={busy} onClick={() => onOpenChange(false)}>取消</button>
				<button type="button" data-action="save" disabled={busy} onClick={() => void save()}>存檔</button>
			</div>
		</div>
	);
}
