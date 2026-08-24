"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Button, Card, Input, Label } from "@startkiter/ui";
import { useState } from "react";

type CourseOption = { id: string; title: string };
type Invite = {
	id: string;
	courseId: string;
	email: string | null;
	maxUses: number | null;
	usedCount: number;
	expiresAt: Date | string | null;
	active: boolean;
	createdAt: Date | string;
	course: { id: string; title: string };
};

export function CourseInvitesPanel({ courses, initialInvites }: { courses: CourseOption[]; initialInvites: Invite[] }) {
	const [invites, setInvites] = useState(initialInvites);
	const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
	const [email, setEmail] = useState("");
	const [maxUses, setMaxUses] = useState("1");
	const [expiresAt, setExpiresAt] = useState("");
	const [createdUrl, setCreatedUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function createInvite(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		setError(null);
		setCreatedUrl(null);
		try {
			const result = await orpcClient.course.createCourseInvite({
				courseId,
				email: email.trim() || null,
				maxUses: maxUses.trim() ? Number(maxUses) : null,
				expiresAt: expiresAt ? new Date(expiresAt) : null,
			});
			setCreatedUrl(result.inviteUrl);
			setInvites((current) => [{ ...result.invite, course: courses.find((course) => course.id === courseId) ?? { id: courseId, title: courseId } }, ...current]);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "建立邀請失敗。");
		} finally {
			setSubmitting(false);
		}
	}

	async function deactivate(inviteId: string) {
		try {
			await orpcClient.course.deactivateCourseInvite({ inviteId });
			setInvites((current) => current.map((invite) => invite.id === inviteId ? { ...invite, active: false } : invite));
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "停用邀請失敗。");
		}
	}

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-6" data-testid="course-invites-admin">
			<Card className="space-y-5 p-6">
				<div>
					<p className="text-sm text-muted-foreground">Course access</p>
					<h1 className="text-2xl font-bold">課程邀請連結</h1>
				</div>
				<form className="grid gap-4 md:grid-cols-2" onSubmit={createInvite} data-testid="course-invite-form">
					<label className="grid gap-1 text-sm"><Label htmlFor="invite-course">課程</Label><select id="invite-course" className="h-9 rounded-xl border bg-card px-3" value={courseId} onChange={(event) => setCourseId(event.target.value)} required>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
					<label className="grid gap-1 text-sm"><Label htmlFor="invite-max-uses">使用次數上限</Label><Input id="invite-max-uses" type="number" min="1" step="1" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} /></label>
					<label className="grid gap-1 text-sm"><Label htmlFor="invite-email">限定 email（可留白）</Label><Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
					<label className="grid gap-1 text-sm"><Label htmlFor="invite-expires-at">到期時間（可留白）</Label><Input id="invite-expires-at" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></label>
					<div className="md:col-span-2"><Button type="submit" loading={submitting} data-testid="create-course-invite">建立邀請</Button></div>
				</form>
				{createdUrl && <div className="rounded-xl border bg-muted/30 p-4 text-sm" data-testid="course-invite-created"><p className="font-medium">邀請已建立，明文連結只顯示這一次：</p><code className="mt-2 block break-all">{createdUrl}</code></div>}
				{error && <p className="text-sm text-destructive" data-testid="course-invite-admin-error">{error}</p>}
			</Card>

			<Card className="space-y-4 p-6">
				<h2 className="text-lg font-semibold">既有邀請</h2>
				<div className="space-y-3" data-testid="course-invite-list">
					{invites.map((invite) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4" key={invite.id} data-testid="course-invite-row"><div><p className="font-medium">{invite.course.title}</p><p className="text-sm text-muted-foreground">{invite.email ?? "不限 email"} · {invite.usedCount}/{invite.maxUses ?? "∞"} 次 · {invite.active ? "啟用中" : "已停用"}</p></div>{invite.active && <Button type="button" variant="outline" onClick={() => deactivate(invite.id)}>停用</Button>}</article>)}
					{invites.length === 0 && <p className="text-sm text-muted-foreground">尚未建立邀請。</p>}
				</div>
			</Card>
		</div>
	);
}
