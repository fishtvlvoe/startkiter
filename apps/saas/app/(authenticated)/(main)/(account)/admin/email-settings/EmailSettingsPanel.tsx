"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@startkiter/ui";

import { orpcClient } from "@shared/lib/orpc-client";

import type { WelcomeEmailBlock } from "./welcome-email-composer";

const WelcomeEmailComposer = dynamic(() => import("./welcome-email-composer"), {
	ssr: false,
	loading: () => <p className="text-sm text-muted-foreground">編輯器載入中…</p>,
});

type CourseSetting = {
	enabled: boolean;
	subjectTemplate: string;
	markdownTemplate: string;
	contentJson: string | null;
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
type TestSendStatus = "idle" | "sending" | "success" | "error";

const DEFAULT_SETTING: CourseSetting = {
	enabled: false,
	subjectTemplate: "歡迎 {{userName}} 加入 {{courseName}}",
	markdownTemplate: "歡迎你加入 **{{courseName}}**！\n\n[開始上課]({{courseUrl}})",
	contentJson: null,
};

function parseContentJson(raw: string | null): WelcomeEmailBlock[] | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as unknown;
		return Array.isArray(parsed) ? (parsed as WelcomeEmailBlock[]) : null;
	} catch {
		return null;
	}
}

function blocksFromMarkdownFallback(markdown: string): WelcomeEmailBlock[] {
	const text = markdown.trim();
	if (!text) return [{ type: "paragraph", content: "" }];
	return text.split(/\n{2,}/).map((paragraph) => ({
		type: "paragraph" as const,
		content: paragraph.replace(/\n/g, " "),
	}));
}

export default function EmailSettingsPanel({ initialCourses }: { initialCourses: Course[] }) {
	const [courses, setCourses] = useState(initialCourses);
	const [selectedCourseId, setSelectedCourseId] = useState(initialCourses[0]?.id ?? "");
	const [setting, setSetting] = useState<CourseSetting>(initialCourses[0]?.welcomeEmail ?? DEFAULT_SETTING);
	const [blocks, setBlocks] = useState<WelcomeEmailBlock[]>(() => {
		const initial = initialCourses[0]?.welcomeEmail ?? DEFAULT_SETTING;
		return parseContentJson(initial.contentJson) ?? blocksFromMarkdownFallback(initial.markdownTemplate);
	});
	const [composerKey, setComposerKey] = useState(initialCourses[0]?.id ?? "empty");
	const [logs, setLogs] = useState<DeliveryLog[]>([]);
	const [typeFilter, setTypeFilter] = useState<DeliveryType | "">("");
	const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "">("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [testEmail, setTestEmail] = useState("");
	const [testStatus, setTestStatus] = useState<TestSendStatus>("idle");
	const [testFeedback, setTestFeedback] = useState("");

	useEffect(() => {
		const selected = courses.find((course) => course.id === selectedCourseId);
		const nextSetting = selected?.welcomeEmail ?? DEFAULT_SETTING;
		setSetting(nextSetting);
		setBlocks(parseContentJson(nextSetting.contentJson) ?? blocksFromMarkdownFallback(nextSetting.markdownTemplate));
		setComposerKey(selectedCourseId || "empty");
		setTestStatus("idle");
		setTestFeedback("");
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

	const contentJson = useMemo(() => JSON.stringify(blocks), [blocks]);

	async function save() {
		if (!selectedCourseId || !setting.subjectTemplate.trim()) {
			setMessage("請選擇課程並填寫郵件主旨。");
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
				contentJson,
			});
			setCourses((current) => current.map((course) =>
				course.id === selectedCourseId
					? {
							...course,
							welcomeEmail: {
								enabled: result.setting.enabled,
								subjectTemplate: result.setting.subjectTemplate,
								markdownTemplate: result.setting.markdownTemplate,
								contentJson: result.setting.contentJson ?? null,
							},
						}
					: course,
			));
			setMessage("郵件設定已儲存。");
		} catch {
			setMessage("郵件設定儲存失敗。");
		} finally {
			setSaving(false);
		}
	}

	async function sendTest() {
		const recipient = testEmail.trim();
		if (!recipient) {
			setTestStatus("error");
			setTestFeedback("請輸入測試收件信箱");
			return;
		}
		if (!selectedCourseId) {
			setTestStatus("error");
			setTestFeedback("請先選擇課程");
			return;
		}

		setTestStatus("sending");
		setTestFeedback("寄出中…");
		try {
			const result = await orpcClient.course.sendWelcomeEmailTest({
				courseId: selectedCourseId,
				toEmail: recipient,
			});
			setTestStatus("success");
			setTestFeedback(`已寄出測試信到 ${result.toEmail}`);
		} catch (error) {
			const reason = error instanceof Error ? error.message : "寄送失敗";
			setTestStatus("error");
			setTestFeedback(`沒有寄出：${reason}`);
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
								<Label>歡迎信內文</Label>
								<WelcomeEmailComposer
									key={composerKey}
									value={blocks}
									onChange={setBlocks}
								/>
							</div>
							<div className="space-y-2 rounded-md border p-3">
								<Label htmlFor="test-email">測試收件信箱</Label>
								<div className="flex flex-col gap-2 sm:flex-row">
									<Input
										id="test-email"
										type="email"
										value={testEmail}
										onChange={(event) => setTestEmail(event.target.value)}
										placeholder="fish@example.com"
									/>
									<Button
										id="send-test-email"
										type="button"
										variant="outline"
										disabled={testStatus === "sending"}
										onClick={() => void sendTest()}
									>
										寄測試信
									</Button>
								</div>
								{testFeedback && (
									<p
										className={`text-sm ${testStatus === "error" ? "text-red-700" : "text-muted-foreground"}`}
										role="status"
									>
										{testFeedback}
									</p>
								)}
								{testStatus === "success" && (
									<p className="text-xs text-muted-foreground">請到收件匣（含垃圾郵件）確認版面。</p>
								)}
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
