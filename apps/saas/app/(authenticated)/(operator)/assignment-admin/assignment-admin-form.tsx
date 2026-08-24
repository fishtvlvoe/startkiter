"use client";

import { Button, Card, Input, Label } from "@startkiter/ui";
import { orpcClient } from "@shared/lib/orpc-client";
import { useRef, useState } from "react";

type LessonOption = { id: string; title: string; chapterTitle: string; courseTitle: string };
type Submission = {
	id: string;
	status: string;
	user: { id: string; name: string; email: string };
	content: string | null;
	attachments: { filename: string; mimeType: string; size: number }[];
	reviews: { score: number | null; letterGrade: string | null; feedback: string | null }[];
};

type ExistingAssignment = { id: string; title: string };

export function AssignmentAdminForm({ lessons, existingAssignments }: { lessons: LessonOption[]; existingAssignments: ExistingAssignment[] }) {
	const [title, setTitle] = useState("");
	const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
	const [description, setDescription] = useState("請完成這份作業並附上必要檔案。");
	const [createdId, setCreatedId] = useState<string | null>(null);
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<Record<string, string>>({});
	const [scores, setScores] = useState<Record<string, string>>({});
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
	const submissionRequestVersion = useRef(0);

	async function createAssignment(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setMessage(null);
		setIsSubmitting(true);
		try {
			const created = await orpcClient.assignment.create({
				title,
				body: {
					lessonId,
					description,
					submissionType: "TEXT_AND_FILES",
					editorMode: "RICH_TEXT",
					minWords: 0,
					maxWords: 2_000,
					maxImages: 0,
					maxImageSize: 5_000_000,
					maxFiles: 1,
					maxFileSize: 10_000_000,
					allowedExtensions: ["txt", "md", "pdf"],
					gradingType: "SCORE",
					passingScore: 60,
					dueAt: null,
				},
			});
			setCreatedId(created.id);
			setMessage("作業已建立。");
		} catch {
			setError("建立作業失敗，請確認單元與內容完整。");
		} finally {
			setIsSubmitting(false);
		}
	}

	async function loadSubmissions(options: { append?: boolean } = {}) {
		if (!createdId) return;
		const append = options.append ?? false;
		const requestVersion = ++submissionRequestVersion.current;
		setError(null);
		setIsLoadingSubmissions(true);
		try {
			const result = await orpcClient.assignment.operatorList({ pluginContentId: createdId, cursor: append ? nextCursor ?? undefined : undefined, limit: 50 });
			if (requestVersion !== submissionRequestVersion.current) return;
			setSubmissions((current) => append ? [...current, ...(result.submissions as Submission[])] : (result.submissions as Submission[]));
			setNextCursor(result.nextCursor);
			setMessage(`已載入 ${append ? "更多 " : ""}${result.submissions.length} 份提交。`);
		} catch {
			if (requestVersion !== submissionRequestVersion.current) return;
			setError("載入提交失敗。");
		} finally {
			if (requestVersion === submissionRequestVersion.current) setIsLoadingSubmissions(false);
		}
	}

	async function reviewSubmission(submissionId: string) {
		setError(null);
		try {
			await orpcClient.assignment.review({
				submissionId,
				score: scores[submissionId]?.trim() ? Number(scores[submissionId]) : null,
				feedback: feedback[submissionId] ?? null,
				letterGrade: null,
			});
			setMessage("批改結果已儲存。");
			await loadSubmissions();
		} catch {
			setError("儲存批改結果失敗。");
		}
	}

	return (
		<Card className="max-w-4xl space-y-6 p-6" data-testid="assignment-admin-form">
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">Plugin：assignment</p>
				<h1 className="text-2xl font-bold">建立作業</h1>
				<p className="text-sm text-muted-foreground">作業定義存入共用 PluginContent，提交、附件與批改資料使用獨立資料表。</p>
			</div>
			{existingAssignments.length > 0 && (
				<section className="space-y-3 rounded-2xl border p-4" data-testid="assignment-existing-list">
					<h2 className="font-semibold">既有作業</h2>
					{existingAssignments.map((assignment) => (
						<div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
							<a className="underline" href={`/assignment/${assignment.id}`}>{assignment.title}</a>
							<Button type="button" variant="outline" onClick={() => { submissionRequestVersion.current += 1; setCreatedId(assignment.id); setSubmissions([]); setNextCursor(null); setFeedback({}); setScores({}); setMessage(null); setError(null); }}>查看提交</Button>
						</div>
					))}
				</section>
			)}
			{createdId ? (
				<section className="space-y-4" data-testid="assignment-created">
					<p className="text-green-600">作業已建立：{createdId}</p>
					<div className="flex flex-wrap gap-4">
						<a className="underline" href={`/assignment/${createdId}`}>開啟學員作業頁</a>
							<Button type="button" variant="outline" disabled={isLoadingSubmissions} onClick={() => loadSubmissions()}>載入提交</Button>
					</div>
					<div className="space-y-4" data-testid="assignment-submission-list">
						{submissions.length === 0 && <p className="text-sm text-muted-foreground">目前沒有已送出的作業。</p>}
						{submissions.map((submission) => (
							<article key={submission.id} className="space-y-3 rounded-2xl border p-4" data-testid={`assignment-submission-${submission.id}`}>
								<div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{submission.user.name}（{submission.user.email}）</span><span>{submission.status}</span></div>
								{submission.content && <pre className="whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm">{submission.content}</pre>}
								{submission.attachments.length > 0 && <p className="text-sm">附件：{submission.attachments.map((attachment) => attachment.filename).join("、")}</p>}
								<label className="grid gap-1 text-sm"><Label htmlFor={`assignment-score-${submission.id}`}>分數</Label><Input id={`assignment-score-${submission.id}`} data-testid={`assignment-score-${submission.id}`} type="number" min="0" max="100" value={scores[submission.id] ?? submission.reviews[0]?.score ?? ""} onChange={(event) => setScores((current) => ({ ...current, [submission.id]: event.target.value }))} /></label>
								<label className="grid gap-1 text-sm"><Label htmlFor={`assignment-feedback-${submission.id}`}>回饋</Label><textarea id={`assignment-feedback-${submission.id}`} data-testid={`assignment-feedback-${submission.id}`} className="min-h-28 rounded-xl border bg-card p-3" value={feedback[submission.id] ?? submission.reviews[0]?.feedback ?? ""} onChange={(event) => setFeedback((current) => ({ ...current, [submission.id]: event.target.value }))} /></label>
								<Button type="button" variant="primary" onClick={() => reviewSubmission(submission.id)}>儲存批改</Button>
							</article>
						))}
						{nextCursor && <Button type="button" variant="outline" disabled={isLoadingSubmissions} onClick={() => loadSubmissions({ append: true })}>載入更多提交</Button>}
					</div>
				</section>
			) : (
				<form className="space-y-6" onSubmit={createAssignment} aria-label="assignment-create-form">
					<label className="grid gap-1 text-sm"><Label htmlFor="assignment-title">作業名稱</Label><Input id="assignment-title" value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
					<label className="grid gap-1 text-sm"><Label htmlFor="assignment-lesson">綁定單元</Label><select id="assignment-lesson" className="h-9 rounded-xl border bg-card px-3" value={lessonId} onChange={(event) => setLessonId(event.target.value)} required>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.courseTitle} / {lesson.chapterTitle} / {lesson.title}</option>)}</select></label>
					<label className="grid gap-1 text-sm"><Label htmlFor="assignment-description">作業說明</Label><textarea id="assignment-description" className="min-h-32 rounded-xl border bg-card p-3" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button type="submit" variant="primary" size="lg" loading={isSubmitting}>建立作業</Button>
				</form>
			)}
			{message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
			{error && createdId && <p className="text-sm text-destructive">{error}</p>}
		</Card>
	);
}
