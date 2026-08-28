"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@startkiter/ui";

import { orpcClient } from "@shared/lib/orpc-client";

type CourseSetting = {
	enabled: boolean;
	subjectTemplate: string;
	markdownTemplate: string;
};

type Course = {
	id: string;
	title: string;
	welcomeEmail: CourseSetting | null;
};

type DeliveryLog = {
	id: string;
	type: "WELCOME_EMAIL" | "EXPIRATION_REMINDER";
	status: "PENDING" | "SENT" | "FAILED";
	toEmail: string;
	subject: string;
	errorMessage: string | null;
	createdAt: Date;
	course: { id: string; title: string } | null;
};

type DeliveryType = DeliveryLog["type"];
type DeliveryStatus = DeliveryLog["status"];

const DEFAULT_SETTING: CourseSetting = {
	enabled: false,
	subjectTemplate: "歡迎 {{userName}} 加入 {{courseName}}",
	markdownTemplate: "歡迎你加入 **{{courseName}}**！\n\n[開始上課]({{courseUrl}})",
};

export default function EmailSettingsPanel({ initialCourses }: { initialCourses: Course[] }) {
	const [courses, setCourses] = useState(initialCourses);
	const [selectedCourseId, setSelectedCourseId] = useState(initialCourses[0]?.id ?? "");
	const [setting, setSetting] = useState<CourseSetting>(initialCourses[0]?.welcomeEmail ?? DEFAULT_SETTING);
	const [logs, setLogs] = useState<DeliveryLog[]>([]);
	const [typeFilter, setTypeFilter] = useState<DeliveryType | "">("");
	const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "">("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");

	useEffect(() => {
		const selected = courses.find((course) => course.id === selectedCourseId);
		setSetting(selected?.welcomeEmail ?? DEFAULT_SETTING);
	}, [courses, selectedCourseId]);

	useEffect(() => {
		void orpcClient.course.listEmailDeliveryLog({
			limit: 50,
			...(typeFilter ? { type: typeFilter } : {}),
			...(statusFilter ? { status: statusFilter } : {}),
		})
			.then((result) => setLogs(result.logs as DeliveryLog[]))
			.catch(() => setMessage("送達紀錄載入失敗。"));
	}, [statusFilter, typeFilter]);

	function updateSetting<K extends keyof CourseSetting>(key: K, value: CourseSetting[K]) {
		setSetting((current) => ({ ...current, [key]: value }));
	}

	async function save() {
		if (!selectedCourseId || !setting.subjectTemplate.trim()) {
			setMessage("請選擇課程並填寫郵件主旨。" );
			return;
		}

		setSaving(true);
		setMessage("");
		try {
			const result = await orpcClient.course.updateWelcomeEmailSettings({
				courseId: selectedCourseId,
				enabled: setting.enabled,
				subjectTemplate: setting.subjectTemplate.trim(),
				markdownTemplate: setting.markdownTemplate,
			});
			setCourses((current) => current.map((course) =>
				course.id === selectedCourseId ? { ...course, welcomeEmail: result.setting } : course,
			));
			setMessage("郵件設定已儲存。" );
		} catch {
			setMessage("郵件設定儲存失敗。" );
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6" data-testid="course-email-settings-page">
			<div>
				<h1 className="text-2xl font-semibold">課程郵件設定</h1>
				<p className="mt-1 text-sm text-muted-foreground">設定付款成功後的歡迎信，並查看到期提醒與歡迎信送達結果。</p>
			</div>

			<Card>
				<CardHeader><CardTitle>歡迎信模板</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					{courses.length === 0 ? <p className="text-sm text-muted-foreground">目前沒有課程。</p> : (
						<>
							<div className="space-y-2">
								<Label htmlFor="course-select">課程</Label>
								<select id="course-select" className="w-full rounded-md border bg-background px-3 py-2" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
									{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
								</select>
							</div>
							<label className="flex items-center gap-2 text-sm">
								<input type="checkbox" checked={setting.enabled} onChange={(event) => updateSetting("enabled", event.target.checked)} />
								付款成功後寄送歡迎信
							</label>
							<div className="space-y-2">
								<Label htmlFor="email-subject">主旨模板</Label>
								<Input id="email-subject" value={setting.subjectTemplate} onChange={(event) => updateSetting("subjectTemplate", event.target.value)} />
								<p className="text-xs text-muted-foreground">可用變數：&#123;&#123;userName&#125;&#125;、&#123;&#123;courseName&#125;&#125;、&#123;&#123;courseUrl&#125;&#125;</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email-markdown">Markdown 內文</Label>
								<Textarea id="email-markdown" className="min-h-48" value={setting.markdownTemplate} onChange={(event) => updateSetting("markdownTemplate", event.target.value)} />
							</div>
							<Button type="button" disabled={saving} onClick={() => void save()}>{saving ? "儲存中…" : "儲存設定"}</Button>
						</>
					)}
					{message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>送達紀錄</CardTitle></CardHeader>
				<CardContent>
					<div className="mb-4 grid gap-3 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="delivery-type-filter">郵件類型</Label>
							<select
								id="delivery-type-filter"
								className="w-full rounded-md border bg-background px-3 py-2"
								value={typeFilter}
								onChange={(event) => setTypeFilter(event.target.value as DeliveryType | "")}
							>
								<option value="">全部類型</option>
								<option value="WELCOME_EMAIL">購買歡迎信</option>
								<option value="EXPIRATION_REMINDER">到期提醒信</option>
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="delivery-status-filter">送達狀態</Label>
							<select
								id="delivery-status-filter"
								className="w-full rounded-md border bg-background px-3 py-2"
								value={statusFilter}
								onChange={(event) => setStatusFilter(event.target.value as DeliveryStatus | "")}
							>
								<option value="">全部狀態</option>
								<option value="PENDING">待處理</option>
								<option value="SENT">已送出</option>
								<option value="FAILED">失敗</option>
							</select>
						</div>
					</div>
					{logs.length === 0 ? <p className="text-sm text-muted-foreground">目前沒有送達紀錄。</p> : (
						<div className="space-y-3">
							{logs.map((log) => (
								<div className="rounded-xl border p-3 text-sm" key={log.id}>
									<div className="flex flex-wrap justify-between gap-2">
										<span className="font-medium">{log.course?.title ?? "未指定課程"} · {log.type}</span>
										<span>{log.status}</span>
									</div>
									<p className="mt-1 text-muted-foreground">{log.toEmail} · {new Date(log.createdAt).toLocaleString("zh-TW")}</p>
									<p className="mt-1">{log.subject}</p>
									{log.errorMessage && <p className="mt-1 text-red-700">{log.errorMessage}</p>}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
