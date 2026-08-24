"use client";

import type { AssignmentDefinitionBody } from "@startkiter/course-assignment";
import { Button, Card, Input, Label } from "@startkiter/ui";
import { orpcClient } from "@shared/lib/orpc-client";
import { useEffect, useRef, useState } from "react";

	type AssignmentResult = { status: string; reviews: { score: number | null; letterGrade: string | null; feedback: string | null }[] };
	type Assignment = { id: string; title: string; body: AssignmentDefinitionBody };
	type PendingAttachment = { attachmentId: string; submissionId: string; filename: string; mimeType: string; size: number; storageKey: string };

export function AssignmentLearner({ assignment }: { assignment: Assignment }) {
	const [content, setContent] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
	const [submissionId, setSubmissionId] = useState<string | null>(null);
	const [result, setResult] = useState<AssignmentResult | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isWorking, setIsWorking] = useState(false);
	const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
	const draftRevision = useRef(0);

	useEffect(() => {
		let cancelled = false;
		orpcClient.assignment.get({ pluginContentId: assignment.id }).then((value) => {
			if (cancelled) return;
			setContent(value.draft?.content ?? "");
			draftRevision.current = value.draft?.revision ?? 0;
			const restoredUploads = value.pendingUploads ?? (value.pendingUpload ? [value.pendingUpload] : []);
			if (restoredUploads.length > 0) {
				setPendingAttachments(restoredUploads);
				setSubmissionId(restoredUploads[0].submissionId);
			}
			setResult(value.result as AssignmentResult | null);
			setHasLoadedDraft(true);
		}).catch(() => {
			if (!cancelled) setError("載入作業失敗，請重新整理頁面。");
		});
		return () => { cancelled = true; };
	}, [assignment.id]);

	useEffect(() => {
		if (!hasLoadedDraft) return;
		const timer = window.setTimeout(() => {
			draftRevision.current += 1;
			const revision = draftRevision.current;
			void orpcClient.assignment.saveDraft({
				pluginContentId: assignment.id,
				content,
				contentFormat: assignment.body.editorMode,
				revision,
			}).then((saved) => { draftRevision.current = Math.max(draftRevision.current, saved.revision); }).catch(() => undefined);
		}, 800);
		return () => window.clearTimeout(timer);
	}, [assignment.body.editorMode, assignment.id, content, hasLoadedDraft]);

	async function uploadSelectedFiles(): Promise<{ attachments: PendingAttachment[]; submissionId: string } | null> {
		if (pendingAttachments.length > 0 && submissionId) return { attachments: pendingAttachments, submissionId };
		if (!files.length) return null;
		if (files.length > assignment.body.maxFiles) throw new Error("too many files");
		const uploaded: PendingAttachment[] = [];
		try {
			for (const file of files) {
				const mimeType = file.type || "application/octet-stream";
				const upload = await orpcClient.assignment.createUploadUrl({ pluginContentId: assignment.id, filename: file.name, mimeType, size: file.size });
				const response = await fetch(upload.signedUploadUrl, { method: "PUT", headers: { "Content-Type": mimeType, "If-None-Match": "*" }, body: file });
				if (!response.ok) throw new Error("upload failed");
				uploaded.push({ attachmentId: upload.attachmentId, submissionId: upload.submissionId, filename: file.name, mimeType, size: file.size, storageKey: upload.storageKey });
			}
		} catch (error) {
			await Promise.all(uploaded.map((attachment) => orpcClient.assignment.cancelUpload({ pluginContentId: assignment.id, attachmentId: attachment.attachmentId }).catch(() => undefined)));
			throw error;
		}
		const nextSubmissionId = uploaded[0]?.submissionId;
		if (!nextSubmissionId) return null;
		setPendingAttachments(uploaded);
		setSubmissionId(nextSubmissionId);
		return { attachments: uploaded, submissionId: nextSubmissionId };
	}

	async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setMessage(null);
		setIsWorking(true);
		try {
			await uploadSelectedFiles();
			const saved = await orpcClient.assignment.saveDraft({ pluginContentId: assignment.id, content, contentFormat: assignment.body.editorMode, revision: ++draftRevision.current });
			draftRevision.current = Math.max(draftRevision.current, saved.revision);
			setMessage("草稿已儲存。");
		} catch {
			setError("草稿儲存失敗，請確認附件格式與大小。");
		} finally {
			setIsWorking(false);
		}
	}

	async function submitAssignment() {
		setError(null);
		setMessage(null);
		setIsWorking(true);
		try {
			const uploaded = await uploadSelectedFiles();
			const saved = await orpcClient.assignment.saveDraft({ pluginContentId: assignment.id, content, contentFormat: assignment.body.editorMode, revision: ++draftRevision.current });
			draftRevision.current = Math.max(draftRevision.current, saved.revision);
			await orpcClient.assignment.submit({ pluginContentId: assignment.id, submissionId: uploaded?.submissionId ?? submissionId, content, contentFormat: assignment.body.editorMode, attachments: uploaded?.attachments ?? [] });
			setMessage("作業已送出，等待批改。");
		} catch {
			setError("作業送出失敗，請確認內容與附件限制。");
		} finally {
			setIsWorking(false);
		}
	}

	return (
		<Card className="mx-auto max-w-3xl space-y-6 p-6" data-testid="assignment-learner" data-assignment-id={assignment.id}>
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">課程作業</p>
				<h1 className="text-2xl font-bold">{assignment.title}</h1>
				<div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: assignment.body.description }} />
			</div>
			<form className="space-y-5" onSubmit={saveDraft} aria-label="assignment-learner-form">
				<label className="grid gap-1 text-sm"><Label htmlFor="assignment-content">作業內容</Label><textarea id="assignment-content" data-testid="assignment-content" className="min-h-48 rounded-xl border bg-card p-3" value={content} onChange={(event) => setContent(event.target.value)} /></label>
				<label className="grid gap-1 text-sm"><Label htmlFor="assignment-file">附件（最多 {assignment.body.maxFiles} 個）</Label><Input id="assignment-file" data-testid="assignment-file" type="file" multiple={assignment.body.maxFiles > 1} onChange={(event) => {
					const selectedFiles = Array.from(event.target.files ?? []);
					void Promise.all(pendingAttachments.map((attachment) => orpcClient.assignment.cancelUpload({ pluginContentId: assignment.id, attachmentId: attachment.attachmentId }).catch(() => undefined)));
					setPendingAttachments([]);
					setSubmissionId(null);
					if (selectedFiles.length > assignment.body.maxFiles) {
						setFiles([]);
						setError(`最多只能上傳 ${assignment.body.maxFiles} 個檔案。`);
						return;
					}
					setError(null);
					setFiles(selectedFiles);
				}} />
				{files.length > 0 && <p className="text-xs text-muted-foreground">已選擇：{files.map((file) => file.name).join("、")}</p>}</label>
				<div className="flex flex-wrap gap-3"><Button type="submit" variant="outline" loading={isWorking}>儲存草稿</Button><Button type="button" variant="primary" loading={isWorking} onClick={submitAssignment}>送出作業</Button></div>
			</form>
			{message && <p className="text-sm text-green-600" data-testid="assignment-status" role="status">{message}</p>}
			{error && <p className="text-sm text-destructive" data-testid="assignment-error">{error}</p>}
			{result && <section className="space-y-3 rounded-2xl border p-4" data-testid="assignment-result"><h2 className="font-semibold">批改結果</h2>{result.reviews.map((review, index) => <div key={index} className="space-y-2"><p>{review.score !== null ? `分數：${review.score}` : `等第：${review.letterGrade ?? "尚未填寫"}`}</p>{review.feedback && <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: review.feedback }} />}</div>)}</section>}
		</Card>
	);
}
