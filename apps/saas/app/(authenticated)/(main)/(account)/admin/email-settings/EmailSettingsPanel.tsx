"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
	AlertTriangle,
	CheckCircle2,
} from "lucide-react";
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
} from "@startkiter/ui";
import type {
	EmailProviderType,
	EmailSettingsSummary,
	StoredEmailSettings,
} from "@startkiter/mail";

import { orpcClient } from "@shared/lib/orpc-client";
import {
	saveEmailSettingsAction,
	sendTestEmailAction,
} from "./actions";

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

const DEFAULT_COURSE_SETTING: CourseSetting = {
	enabled: false,
	subjectTemplate: "歡迎 {{userName}} 加入 {{courseName}}",
	markdownTemplate: "歡迎你加入 **{{courseName}}**！\n\n[開始上課]({{courseUrl}})",
	contentJson: null,
};

const PROVIDER_NAMES: Record<EmailProviderType, string> = {
	tosend: "ToSend",
	zsend: "ZSend",
	resend: "Resend",
	smtp: "SMTP",
};

function parseContentJson(raw: string | null): WelcomeEmailBlock[] | null {
	if (!raw) return null;
	try {
		const parsed = unknownArray(JSON.parse(raw));
		return parsed;
	} catch {
		return null;
	}
}

function unknownArray(val: unknown): WelcomeEmailBlock[] | null {
	return Array.isArray(val) ? (val as WelcomeEmailBlock[]) : null;
}

function blocksFromMarkdownFallback(markdown: string): WelcomeEmailBlock[] {
	const text = markdown.trim();
	if (!text) return [{ type: "paragraph", content: "" }];
	return text.split(/\n{2,}/).map((paragraph) => ({
		type: "paragraph" as const,
		content: paragraph.replace(/\n/g, " "),
	}));
}

function isProviderConfigured(
	summary?: Partial<EmailSettingsSummary> | null,
	provider?: EmailProviderType | null,
): boolean {
	if (!summary || !provider) return false;
	if (provider === "tosend") return Boolean(summary.hasTosendApiKey);
	if (provider === "zsend") return Boolean(summary.hasZsendApiKey);
	if (provider === "resend") return Boolean(summary.hasResendApiKey);
	if (provider === "smtp") return Boolean(summary.smtpHost?.trim());
	return false;
}

export default function EmailSettingsPanel({
	initialCourses,
	initialSettings,
}: {
	initialCourses: Course[];
	initialSettings?: Partial<EmailSettingsSummary>;
}) {
	// 分頁狀態
	const [activeTab, setActiveTab] = useState<"service" | "sender" | "welcome" | "logs">("service");

	// 設定摘要與已儲存狀態
	const [summary, setSummary] = useState<EmailSettingsSummary>(() => {
		const derivedActiveProvider =
			initialSettings?.activeProvider !== undefined
				? initialSettings.activeProvider
				: initialSettings?.provider && isProviderConfigured(initialSettings, initialSettings.provider)
					? { name: initialSettings.provider, source: "stored" as const }
					: null;

		return {
			hasTosendApiKey: false,
			hasZsendApiKey: false,
			hasResendApiKey: false,
			hasSmtpPass: false,
			...initialSettings,
			activeProvider: derivedActiveProvider,
		};
	});

	// 分頁 1: 寄信服務
	const initialProvider: EmailProviderType = initialSettings?.provider ?? "tosend";
	const [provider, setProvider] = useState<EmailProviderType>(initialProvider);
	const [isSaved, setIsSaved] = useState<boolean>(() =>
		Boolean(initialSettings?.provider && isProviderConfigured(initialSettings, initialSettings.provider)),
	);

	// Provider 欄位狀態
	const [tosendApiKey, setTosendApiKey] = useState("");
	const [tosendApiBaseUrl, setTosendApiBaseUrl] = useState(initialSettings?.tosendApiBaseUrl ?? "https://api.tosend.com/v2");
	const [zsendApiKey, setZsendApiKey] = useState("");
	const [zsendDomain, setZsendDomain] = useState(initialSettings?.zsendDomain ?? "");
	const [resendApiKey, setResendApiKey] = useState("");
	const [smtpHost, setSmtpHost] = useState(initialSettings?.smtpHost ?? "");
	const [smtpPort, setSmtpPort] = useState(initialSettings?.smtpPort ? String(initialSettings.smtpPort) : "587");
	const [smtpUser, setSmtpUser] = useState(initialSettings?.smtpUser ?? "");
	const [smtpPass, setSmtpPass] = useState("");
	const [smtpSecure, setSmtpSecure] = useState(Boolean(initialSettings?.smtpSecure));

	const [serviceSaving, setServiceSaving] = useState(false);
	const [serviceMessage, setServiceMessage] = useState("");

	// 分頁 1: 測試發送
	const [serviceTestTo, setServiceTestTo] = useState(initialSettings?.fromEmail ?? "fish@fishot.com");
	const [serviceTestStatus, setServiceTestStatus] = useState<TestSendStatus>("idle");
	const [serviceTestFeedback, setServiceTestFeedback] = useState("");

	// 分頁 2: 寄件人與電子報
	const [senderName, setSenderName] = useState(initialSettings?.senderName ?? "");
	const [fromEmail, setFromEmail] = useState(initialSettings?.fromEmail ?? "");
	const [newsletterSenderName, setNewsletterSenderName] = useState(initialSettings?.newsletterSenderName ?? "");
	const [newsletterReplyTo, setNewsletterReplyTo] = useState(initialSettings?.newsletterReplyTo ?? "");
	const [footerCompany, setFooterCompany] = useState(initialSettings?.footerCompany ?? "");
	const [footerAddress, setFooterAddress] = useState(initialSettings?.footerAddress ?? "");
	const [footerEmail, setFooterEmail] = useState(initialSettings?.footerEmail ?? "");
	const [newsletterRatePerMinute, setNewsletterRatePerMinute] = useState(
		initialSettings?.newsletterRatePerMinute ? String(initialSettings.newsletterRatePerMinute) : "60",
	);
	const [senderSaving, setSenderSaving] = useState(false);
	const [senderMessage, setSenderMessage] = useState("");

	// 分頁 3: 歡迎信模板（沿用現有）
	const [courses, setCourses] = useState(initialCourses);
	const [selectedCourseId, setSelectedCourseId] = useState(initialCourses[0]?.id ?? "");
	const [courseSetting, setCourseSetting] = useState<CourseSetting>(
		initialCourses[0]?.welcomeEmail ?? DEFAULT_COURSE_SETTING,
	);
	const [blocks, setBlocks] = useState<WelcomeEmailBlock[]>(() => {
		const initial = initialCourses[0]?.welcomeEmail ?? DEFAULT_COURSE_SETTING;
		return parseContentJson(initial.contentJson) ?? blocksFromMarkdownFallback(initial.markdownTemplate);
	});
	const [composerKey, setComposerKey] = useState(initialCourses[0]?.id ?? "empty");
	const [welcomeSaving, setWelcomeSaving] = useState(false);
	const [welcomeMessage, setWelcomeMessage] = useState("");
	const [welcomeTestEmail, setWelcomeTestEmail] = useState("");
	const [welcomeTestStatus, setWelcomeTestStatus] = useState<TestSendStatus>("idle");
	const [welcomeTestFeedback, setWelcomeTestFeedback] = useState("");

	// 分頁 4: 送達紀錄（沿用現有）
	const [logs, setLogs] = useState<DeliveryLog[]>([]);
	const [typeFilter, setTypeFilter] = useState<DeliveryType | "">("");
	const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "">("");
	const [logsMessage, setLogsMessage] = useState("");

	useEffect(() => {
		const selected = courses.find((course) => course.id === selectedCourseId);
		const nextSetting = selected?.welcomeEmail ?? DEFAULT_COURSE_SETTING;
		setCourseSetting(nextSetting);
		setBlocks(parseContentJson(nextSetting.contentJson) ?? blocksFromMarkdownFallback(nextSetting.markdownTemplate));
		setComposerKey(selectedCourseId || "empty");
		setWelcomeTestStatus("idle");
		setWelcomeTestFeedback("");
	}, [courses, selectedCourseId]);

	useEffect(() => {
		void orpcClient.course
			.listEmailDeliveryLog({
				limit: 50,
				...(typeFilter ? { type: typeFilter } : {}),
				...(statusFilter ? { status: statusFilter } : {}),
			})
			.then((result) => setLogs(result.logs as DeliveryLog[]))
			.catch(() => setLogsMessage("送達紀錄載入失敗。"));
	}, [statusFilter, typeFilter]);

	function updateCourseSetting<K extends keyof CourseSetting>(key: K, value: CourseSetting[K]) {
		setCourseSetting((current) => ({ ...current, [key]: value }));
	}

	const contentJson = useMemo(() => JSON.stringify(blocks), [blocks]);

	// 儲存分頁 1: 寄信服務
	async function saveServiceSettings() {
		setServiceSaving(true);
		setServiceMessage("");
		try {
			const payload: Partial<StoredEmailSettings> = {
				provider,
			};
			if (provider === "tosend") {
				if (tosendApiKey) payload.tosendApiKey = tosendApiKey.trim();
				if (tosendApiBaseUrl) payload.tosendApiBaseUrl = tosendApiBaseUrl.trim();
			} else if (provider === "zsend") {
				if (zsendApiKey) payload.zsendApiKey = zsendApiKey.trim();
				if (zsendDomain) payload.zsendDomain = zsendDomain.trim();
			} else if (provider === "resend") {
				if (resendApiKey) payload.resendApiKey = resendApiKey.trim();
			} else if (provider === "smtp") {
				payload.smtpHost = smtpHost.trim();
				payload.smtpPort = smtpPort ? parseInt(smtpPort, 10) : 587;
				payload.smtpUser = smtpUser.trim();
				if (smtpPass) payload.smtpPass = smtpPass.trim();
				payload.smtpSecure = smtpSecure;
			}

			const result = await saveEmailSettingsAction(payload);
			if (result.ok) {
				setSummary({
					...result.summary,
					activeProvider: result.summary.activeProvider ?? { name: provider, source: "stored" },
				});
				setIsSaved(true);
				setServiceMessage("寄信服務設定已儲存。");
			} else {
				setServiceMessage(`儲存失敗：${result.error}`);
			}
		} catch {
			setServiceMessage("寄信服務設定儲存失敗。");
		} finally {
			setServiceSaving(false);
		}
	}

	// 寄送分頁 1 測試信
	async function sendServiceTest() {
		const to = serviceTestTo.trim();
		if (!to) {
			setServiceTestStatus("error");
			setServiceTestFeedback("請輸入收件信箱");
			return;
		}

		setServiceTestStatus("sending");
		setServiceTestFeedback("寄送中…");
		try {
			const result = await sendTestEmailAction(to);
			if (result.ok) {
				setServiceTestStatus("success");
				setServiceTestFeedback(`測試信已寄出到 ${to}，請到收件匣確認。`);
			} else {
				setServiceTestStatus("error");
				setServiceTestFeedback(`沒有寄出：${result.error}`);
			}
		} catch (error) {
			const reason = error instanceof Error ? error.message : "寄送失敗";
			setServiceTestStatus("error");
			setServiceTestFeedback(`沒有寄出：${reason}`);
		}
	}

	// 儲存分頁 2: 寄件人與電子報
	async function saveSenderSettings() {
		setSenderSaving(true);
		setSenderMessage("");
		try {
			const payload: Partial<StoredEmailSettings> = {
				senderName: senderName.trim(),
				fromEmail: fromEmail.trim(),
				newsletterSenderName: newsletterSenderName.trim(),
				newsletterReplyTo: newsletterReplyTo.trim(),
				footerCompany: footerCompany.trim(),
				footerAddress: footerAddress.trim(),
				footerEmail: footerEmail.trim(),
				newsletterRatePerMinute: newsletterRatePerMinute ? parseInt(newsletterRatePerMinute, 10) : 60,
			};

			const result = await saveEmailSettingsAction(payload);
			if (result.ok) {
				setSummary(result.summary);
				setSenderMessage("寄件人與電子報設定已儲存。");
			} else {
				setSenderMessage(`儲存失敗：${result.error}`);
			}
		} catch {
			setSenderMessage("寄件人與電子報設定儲存失敗。");
		} finally {
			setSenderSaving(false);
		}
	}

	// 儲存分頁 3: 歡迎信模板
	async function saveWelcomeEmail() {
		if (!selectedCourseId || !courseSetting.subjectTemplate.trim()) {
			setWelcomeMessage("請選擇課程並填寫郵件主旨。");
			return;
		}

		setWelcomeSaving(true);
		setWelcomeMessage("");
		try {
			const result = await orpcClient.course.updateWelcomeEmailSettings({
				courseId: selectedCourseId,
				enabled: courseSetting.enabled,
				subjectTemplate: courseSetting.subjectTemplate.trim(),
				markdownTemplate: courseSetting.markdownTemplate,
				contentJson,
			});
			setCourses((current) =>
				current.map((c) =>
					c.id === selectedCourseId
						? {
								...c,
								welcomeEmail: {
									enabled: result.setting.enabled,
									subjectTemplate: result.setting.subjectTemplate,
									markdownTemplate: result.setting.markdownTemplate,
									contentJson: result.setting.contentJson ?? null,
								},
							}
						: c,
				),
			);
			setWelcomeMessage("郵件設定已儲存。");
		} catch {
			setWelcomeMessage("郵件設定儲存失敗。");
		} finally {
			setWelcomeSaving(false);
		}
	}

	// 寄送分頁 3 歡迎信測試
	async function sendWelcomeTest() {
		const recipient = welcomeTestEmail.trim();
		if (!recipient) {
			setWelcomeTestStatus("error");
			setWelcomeTestFeedback("請輸入測試收件信箱");
			return;
		}
		if (!selectedCourseId) {
			setWelcomeTestStatus("error");
			setWelcomeTestFeedback("請先選擇課程");
			return;
		}

		setWelcomeTestStatus("sending");
		setWelcomeTestFeedback("寄出中…");
		try {
			const result = await orpcClient.course.sendWelcomeEmailTest({
				courseId: selectedCourseId,
				toEmail: recipient,
			});
			setWelcomeTestStatus("success");
			setWelcomeTestFeedback(`已寄出測試信到 ${result.toEmail}`);
		} catch (error) {
			const reason = error instanceof Error ? error.message : "寄送失敗";
			setWelcomeTestStatus("error");
			setWelcomeTestFeedback(`沒有寄出：${reason}`);
		}
	}

	// 狀態條判斷
	const activeProvider = summary.activeProvider;

	return (
		<div className="mx-auto max-w-6xl space-y-6 p-6" data-testid="course-email-settings-page">
			{/* 頂部標題 */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Email 設定</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					設定網站用哪個服務寄信、寄件人是誰，以及歡迎信與送達紀錄。
				</p>
			</div>

			{/* 狀態條 */}
			{activeProvider ? (
				<div
					data-testid="email-settings-status"
					className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"
				>
					<CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
					<span>
						{activeProvider.source === "environment"
							? `目前使用 ${PROVIDER_NAMES[activeProvider.name]} 寄信（來自主機設定）。`
							: `設定已生效，目前使用 ${PROVIDER_NAMES[activeProvider.name]} 寄信。`}
					</span>
				</div>
			) : (
				<div
					data-testid="email-settings-status"
					className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-sm font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
				>
					<AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
					<span>尚未完成設定：網站目前寄不出任何信。請選擇寄信服務並填入金鑰。</span>
				</div>
			)}

			{/* 四個分頁導航 */}
			<div className="flex gap-2 border-b border-border pb-px overflow-x-auto" role="tablist">
				<button
					type="button"
					role="tab"
					data-testid="tab-service"
					aria-selected={activeTab === "service"}
					onClick={() => setActiveTab("service")}
					className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
						activeTab === "service"
							? "border-primary text-primary font-semibold"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
				>
					① 寄信服務
				</button>
				<button
					type="button"
					role="tab"
					data-testid="tab-sender"
					aria-selected={activeTab === "sender"}
					onClick={() => setActiveTab("sender")}
					className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
						activeTab === "sender"
							? "border-primary text-primary font-semibold"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
				>
					② 寄件人與電子報
				</button>
				<button
					type="button"
					role="tab"
					data-testid="tab-welcome"
					aria-selected={activeTab === "welcome"}
					onClick={() => setActiveTab("welcome")}
					className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
						activeTab === "welcome"
							? "border-primary text-primary font-semibold"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
				>
					③ 歡迎信模板
				</button>
				<button
					type="button"
					role="tab"
					data-testid="tab-logs"
					aria-selected={activeTab === "logs"}
					onClick={() => setActiveTab("logs")}
					className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
						activeTab === "logs"
							? "border-primary text-primary font-semibold"
							: "border-transparent text-muted-foreground hover:text-foreground"
					}`}
				>
					④ 送達紀錄
				</button>
			</div>

			{/* 分頁 1: 寄信服務 */}
			<div style={{ display: activeTab === "service" ? "block" : "none" }} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
								1
							</span>
							選擇寄信服務
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							選一家就好。不知道選哪個，選 ToSend（台灣常用、設定最簡單）。
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* 4 個 Provider 卡片 */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							<div
								role="button"
								tabIndex={0}
								data-testid="provider-zsend"
								onClick={() => {
									setProvider("zsend");
									setIsSaved(false);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										setProvider("zsend");
										setIsSaved(false);
									}
								}}
								className={`cursor-pointer rounded-lg border p-3.5 transition-colors ${
									provider === "zsend" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/30"
								}`}
							>
								<div className="font-semibold text-sm">ZSend</div>
								<div className="text-xs text-muted-foreground mt-0.5">Zeabur 寄信服務</div>
							</div>

							<div
								role="button"
								tabIndex={0}
								data-testid="provider-tosend"
								onClick={() => {
									setProvider("tosend");
									setIsSaved(false);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										setProvider("tosend");
										setIsSaved(false);
									}
								}}
								className={`cursor-pointer rounded-lg border p-3.5 transition-colors ${
									provider === "tosend" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/30"
								}`}
							>
								<div className="font-semibold text-sm">ToSend</div>
								<div className="text-xs text-muted-foreground mt-0.5">推薦，只要 API Key</div>
							</div>

							<div
								role="button"
								tabIndex={0}
								data-testid="provider-resend"
								onClick={() => {
									setProvider("resend");
									setIsSaved(false);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										setProvider("resend");
										setIsSaved(false);
									}
								}}
								className={`cursor-pointer rounded-lg border p-3.5 transition-colors ${
									provider === "resend" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/30"
								}`}
							>
								<div className="font-semibold text-sm">Resend</div>
								<div className="text-xs text-muted-foreground mt-0.5">國外常用</div>
							</div>

							<div
								role="button"
								tabIndex={0}
								data-testid="provider-smtp"
								onClick={() => {
									setProvider("smtp");
									setIsSaved(false);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										setProvider("smtp");
										setIsSaved(false);
									}
								}}
								className={`cursor-pointer rounded-lg border p-3.5 transition-colors ${
									provider === "smtp" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/30"
								}`}
							>
								<div className="font-semibold text-sm">SMTP</div>
								<div className="text-xs text-muted-foreground mt-0.5">Gmail／自架信箱</div>
							</div>
						</div>

						{/* 依選取的 Provider 單選顯示對應欄位 */}
						{provider === "zsend" && (
							<div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="fields-zsend">
								<div className="space-y-1.5">
									<Label htmlFor="zsend-api-key">ZSend API Key</Label>
									<Input
										id="zsend-api-key"
										type="password"
										value={zsendApiKey}
										onChange={(e) => {
											setZsendApiKey(e.target.value);
											setIsSaved(false);
										}}
										placeholder={summary.zsendApiKeyHint || "zsend_..."}
									/>
									<p className="text-xs text-muted-foreground">到 Zeabur 後台 → Email 取得</p>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="zsend-domain">已驗證網域</Label>
									<Input
										id="zsend-domain"
										value={zsendDomain}
										onChange={(e) => {
											setZsendDomain(e.target.value);
											setIsSaved(false);
										}}
										placeholder={summary.zsendDomain || "example.com"}
									/>
								</div>
							</div>
						)}

						{provider === "tosend" && (
							<div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="fields-tosend">
								<div className="space-y-1.5">
									<Label htmlFor="tosend-api-key">ToSend API Key</Label>
									<Input
										id="tosend-api-key"
										type="password"
										value={tosendApiKey}
										onChange={(e) => {
											setTosendApiKey(e.target.value);
											setIsSaved(false);
										}}
										placeholder={summary.tosendApiKeyHint || "tsend_..."}
									/>
									<p className="text-xs text-muted-foreground">
										到 ToSend 後台 → API Keys 取得。存檔後只顯示末 4 碼
									</p>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="tosend-base-url">API 位址</Label>
									<Input
										id="tosend-base-url"
										value={tosendApiBaseUrl}
										onChange={(e) => {
											setTosendApiBaseUrl(e.target.value);
											setIsSaved(false);
										}}
										placeholder="https://api.tosend.com/v2"
									/>
									<p className="text-xs text-muted-foreground">一般不用改</p>
								</div>
							</div>
						)}

						{provider === "resend" && (
							<div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="fields-resend">
								<div className="space-y-1.5 sm:col-span-2">
									<Label htmlFor="resend-api-key">Resend API Key</Label>
									<Input
										id="resend-api-key"
										type="password"
										value={resendApiKey}
										onChange={(e) => {
											setResendApiKey(e.target.value);
											setIsSaved(false);
										}}
										placeholder={summary.resendApiKeyHint || "re_123456789"}
									/>
								</div>
							</div>
						)}

						{provider === "smtp" && (
							<div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="fields-smtp">
								<div className="space-y-1.5">
									<Label htmlFor="smtp-host">SMTP 主機</Label>
									<Input
										id="smtp-host"
										value={smtpHost}
										onChange={(e) => {
											setSmtpHost(e.target.value);
											setIsSaved(false);
										}}
										placeholder="smtp.gmail.com"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="smtp-port">埠號</Label>
									<Input
										id="smtp-port"
										type="number"
										value={smtpPort}
										onChange={(e) => {
											setSmtpPort(e.target.value);
											setIsSaved(false);
										}}
										placeholder="587"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="smtp-user">帳號</Label>
									<Input
										id="smtp-user"
										value={smtpUser}
										onChange={(e) => {
											setSmtpUser(e.target.value);
											setIsSaved(false);
										}}
										placeholder="user@example.com"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor="smtp-pass">密碼</Label>
									<Input
										id="smtp-pass"
										type="password"
										value={smtpPass}
										onChange={(e) => {
											setSmtpPass(e.target.value);
											setIsSaved(false);
										}}
										placeholder={summary.smtpPassHint || "••••••••"}
									/>
									<p className="text-xs text-muted-foreground">Gmail 要用「應用程式密碼」</p>
								</div>
								<div className="space-y-1.5 sm:col-span-2">
									<Label htmlFor="smtp-secure">加密連線（SSL）</Label>
									<select
										id="smtp-secure"
										className="w-full rounded-md border bg-background px-3 py-2 text-sm"
										value={smtpSecure ? "true" : "false"}
										onChange={(e) => {
											setSmtpSecure(e.target.value === "true");
											setIsSaved(false);
										}}
									>
										<option value="false">關閉（埠 587）</option>
										<option value="true">開啟（埠 465）</option>
									</select>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* 測試發送區 */}
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
								2
							</span>
							測試發送
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							存檔後寄一封測試信，確認真的收得到（也看一下垃圾郵件匣）。
						</p>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-end">
							<div className="flex-1 space-y-1.5">
								<Label htmlFor="service-test-email">收件信箱</Label>
								<Input
									id="service-test-email"
									type="email"
									value={serviceTestTo}
									onChange={(e) => setServiceTestTo(e.target.value)}
									placeholder="your@email.com"
								/>
							</div>
							<Button
								id="service-send-test-btn"
								type="button"
								variant="outline"
								disabled={!isSaved || serviceTestStatus === "sending"}
								onClick={() => void sendServiceTest()}
							>
								{serviceTestStatus === "sending" ? "寄送中…" : "寄送測試信"}
							</Button>
						</div>
						{serviceTestFeedback && (
							<p
								className={`text-sm ${
									serviceTestStatus === "error" ? "text-destructive" : "text-muted-foreground"
								}`}
								role="status"
							>
								{serviceTestFeedback}
							</p>
						)}
					</CardContent>
				</Card>

				<div className="flex justify-end items-center gap-3">
					{serviceMessage && (
						<p className="text-sm text-muted-foreground" role="status">
							{serviceMessage}
						</p>
					)}
					<Button
						id="save-service-settings-btn"
						type="button"
						disabled={serviceSaving}
						onClick={() => void saveServiceSettings()}
					>
						{serviceSaving ? "儲存中…" : "儲存設定"}
					</Button>
				</div>
			</div>

			{/* 分頁 2: 寄件人與電子報 */}
			<div style={{ display: activeTab === "sender" ? "block" : "none" }} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">寄件人（所有系統信共用）</CardTitle>
						<p className="text-xs text-muted-foreground">
							學員收到信時看到的名稱與寄件信箱。寄件信箱的網域要先在寄信服務驗證過。
						</p>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="sender-name">寄件人名稱</Label>
							<Input
								id="sender-name"
								value={senderName}
								onChange={(e) => setSenderName(e.target.value)}
								placeholder="我的課程平台"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="from-email">寄件 Email</Label>
							<Input
								id="from-email"
								type="email"
								value={fromEmail}
								onChange={(e) => setFromEmail(e.target.value)}
								placeholder="noreply@yourdomain.com"
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">電子報專用</CardTitle>
						<p className="text-xs text-muted-foreground">
							電子報依法要有寄件人實體資訊與退訂方式，這些會自動放在信件頁尾。
						</p>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="newsletter-sender-name">電子報寄件人名稱</Label>
							<Input
								id="newsletter-sender-name"
								value={newsletterSenderName}
								onChange={(e) => setNewsletterSenderName(e.target.value)}
								placeholder="我的課程平台"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="newsletter-reply-to">回覆信箱（Reply-To）</Label>
							<Input
								id="newsletter-reply-to"
								type="email"
								value={newsletterReplyTo}
								onChange={(e) => setNewsletterReplyTo(e.target.value)}
								placeholder="support@example.com"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="footer-company">頁尾公司名稱</Label>
							<Input
								id="footer-company"
								value={footerCompany}
								onChange={(e) => setFooterCompany(e.target.value)}
								placeholder="某某工作室"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="footer-address">頁尾實體地址</Label>
							<Input
								id="footer-address"
								value={footerAddress}
								onChange={(e) => setFooterAddress(e.target.value)}
								placeholder="台北市..."
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="footer-email">頁尾聯絡 Email</Label>
							<Input
								id="footer-email"
								type="email"
								value={footerEmail}
								onChange={(e) => setFooterEmail(e.target.value)}
								placeholder="support@example.com"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="newsletter-rate">每分鐘發送上限</Label>
							<Input
								id="newsletter-rate"
								type="number"
								value={newsletterRatePerMinute}
								onChange={(e) => setNewsletterRatePerMinute(e.target.value)}
								placeholder="60"
							/>
							<p className="text-xs text-muted-foreground">避免被寄信服務判定為濫發</p>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-end items-center gap-3">
					{senderMessage && (
						<p className="text-sm text-muted-foreground" role="status">
							{senderMessage}
						</p>
					)}
					<Button
						id="save-sender-settings-btn"
						type="button"
						disabled={senderSaving}
						onClick={() => void saveSenderSettings()}
					>
						{senderSaving ? "儲存中…" : "儲存設定"}
					</Button>
				</div>
			</div>

			{/* 分頁 3: 歡迎信模板（完全相容既存測試） */}
			<div style={{ display: activeTab === "welcome" ? "block" : "none" }}>
				<Card>
					<CardHeader>
						<CardTitle>歡迎信模板</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{courses.length === 0 ? (
							<p className="text-sm text-muted-foreground">目前沒有課程。</p>
						) : (
							<>
								<div className="space-y-2">
									<Label htmlFor="course-select">課程</Label>
									<select
										id="course-select"
										className="w-full rounded-md border bg-background px-3 py-2 text-sm"
										value={selectedCourseId}
										onChange={(event) => setSelectedCourseId(event.target.value)}
									>
										{courses.map((course) => (
											<option key={course.id} value={course.id}>
												{course.title}
											</option>
										))}
									</select>
								</div>
								<label className="flex items-center gap-2 text-sm cursor-pointer">
									<input
										type="checkbox"
										checked={courseSetting.enabled}
										onChange={(event) => updateCourseSetting("enabled", event.target.checked)}
									/>
									付款成功後寄送歡迎信
								</label>
								<div className="space-y-2">
									<Label htmlFor="email-subject">主旨模板</Label>
									<Input
										id="email-subject"
										value={courseSetting.subjectTemplate}
										onChange={(event) => updateCourseSetting("subjectTemplate", event.target.value)}
									/>
									<p className="text-xs text-muted-foreground">
										可用變數：&#123;&#123;userName&#125;&#125;、&#123;&#123;courseName&#125;&#125;、&#123;&#123;courseUrl&#125;&#125;
									</p>
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
											value={welcomeTestEmail}
											onChange={(event) => setWelcomeTestEmail(event.target.value)}
											placeholder="fish@example.com"
										/>
										<Button
											id="send-test-email"
											type="button"
											variant="outline"
											disabled={welcomeTestStatus === "sending"}
											onClick={() => void sendWelcomeTest()}
										>
											寄測試信
										</Button>
									</div>
									{welcomeTestFeedback && (
										<p
											className={`text-sm ${
												welcomeTestStatus === "error" ? "text-red-700" : "text-muted-foreground"
											}`}
											role="status"
										>
											{welcomeTestFeedback}
										</p>
									)}
									{welcomeTestStatus === "success" && (
										<p className="text-xs text-muted-foreground">
											請到收件匣（含垃圾郵件）確認版面。
										</p>
									)}
								</div>
								<Button
									type="button"
									disabled={welcomeSaving}
									onClick={() => void saveWelcomeEmail()}
								>
									{welcomeSaving ? "儲存中…" : "儲存設定"}
								</Button>
							</>
						)}
						{welcomeMessage && (
							<p className="text-sm text-muted-foreground" role="status">
								{welcomeMessage}
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* 分頁 4: 送達紀錄（完全相容既存測試） */}
			<div style={{ display: activeTab === "logs" ? "block" : "none" }}>
				<Card>
					<CardHeader>
						<CardTitle>送達紀錄</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="mb-4 grid gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="delivery-type-filter">郵件類型</Label>
								<select
									id="delivery-type-filter"
									className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
									className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
						{logsMessage && (
							<p className="mb-2 text-sm text-destructive" role="status">
								{logsMessage}
							</p>
						)}
						{logs.length === 0 ? (
							<p className="text-sm text-muted-foreground">目前沒有送達紀錄。</p>
						) : (
							<div className="space-y-3">
								{logs.map((log) => (
									<div className="rounded-xl border p-3 text-sm" key={log.id}>
										<div className="flex flex-wrap justify-between gap-2">
											<span className="font-medium">
												{log.course?.title ?? "未指定課程"} · {log.type}
											</span>
											<span>{log.status}</span>
										</div>
										<p className="mt-1 text-muted-foreground">
											{log.toEmail} · {new Date(log.createdAt).toLocaleString("zh-TW")}
										</p>
										<p className="mt-1">{log.subject}</p>
										{log.errorMessage && (
											<p className="mt-1 text-red-700">{log.errorMessage}</p>
										)}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
