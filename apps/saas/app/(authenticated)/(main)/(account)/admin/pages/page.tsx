"use client";

import { useEffect, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Textarea,
	toastError,
	toastSuccess,
} from "@startkiter/ui";

type ContentType = "POST" | "PAGE";
type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
type LocaleCode = "zh-tw" | "zh-cn" | "en";

type PageRecord = {
	id: string;
	type: ContentType;
	slug: string;
	locale: LocaleCode | string;
	title: string;
	excerpt: string | null;
	body: string;
	coverImageUrl: string | null;
	seoTitle: string | null;
	seoDescription: string | null;
	tags: string[];
	status: ContentStatus;
	publishedAt: string | Date | null;
	previousSnapshot: unknown | null;
};

type FormState = {
	id: string | null;
	type: ContentType;
	locale: LocaleCode;
	title: string;
	slug: string;
	body: string;
	seoTitle: string;
	seoDescription: string;
	coverImageUrl: string;
	status: ContentStatus;
	hasPreviousSnapshot: boolean;
};

const EMPTY_FORM: FormState = {
	id: null,
	type: "POST",
	locale: "zh-tw",
	title: "",
	slug: "",
	body: "",
	seoTitle: "",
	seoDescription: "",
	coverImageUrl: "",
	status: "DRAFT",
	hasPreviousSnapshot: false,
};

const STATUS_LABEL: Record<ContentStatus, string> = {
	DRAFT: "草稿",
	PUBLISHED: "已發布",
	ARCHIVED: "已下架",
};

const STATUS_BADGE: Record<ContentStatus, "info" | "success" | "error"> = {
	DRAFT: "info",
	PUBLISHED: "success",
	ARCHIVED: "error",
};

const TYPE_LABEL: Record<ContentType, string> = {
	POST: "文章",
	PAGE: "頁面",
};

export default function AdminPagesCmsPage() {
	const [pages, setPages] = useState<PageRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<"list" | "form">("list");
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [saving, setSaving] = useState(false);
	const [warnings, setWarnings] = useState<string[]>([]);

	async function loadData() {
		setLoading(true);
		try {
			const res = await fetch("/api/pages-cms");
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			setPages(data.pages ?? []);
		} catch {
			toastError("載入頁面資料失敗");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadData();
	}, []);

	function openNew() {
		setForm(EMPTY_FORM);
		setWarnings([]);
		setView("form");
	}

	function openEdit(page: PageRecord) {
		setForm({
			id: page.id,
			type: page.type,
			locale: (page.locale as LocaleCode) || "zh-tw",
			title: page.title,
			slug: page.slug,
			body: page.body,
			seoTitle: page.seoTitle ?? "",
			seoDescription: page.seoDescription ?? "",
			coverImageUrl: page.coverImageUrl ?? "",
			status: page.status,
			hasPreviousSnapshot: page.previousSnapshot != null,
		});
		setWarnings([]);
		setView("form");
	}

	async function handleSave(nextStatus: ContentStatus) {
		if (!form.title.trim() || !form.slug.trim()) {
			toastError("標題與 slug 為必填");
			return;
		}

		setSaving(true);
		try {
			const payload = {
				type: form.type,
				locale: form.locale,
				title: form.title.trim(),
				slug: form.slug.trim(),
				body: form.body,
				seoTitle: form.seoTitle.trim() || null,
				seoDescription: form.seoDescription.trim() || null,
				coverImageUrl: form.coverImageUrl.trim() || null,
				status: nextStatus,
			};

			const res = form.id
				? await fetch(`/api/pages-cms/${form.id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					})
				: await fetch("/api/pages-cms", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error ?? `HTTP ${res.status}`);
			}

			setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
			toastSuccess(nextStatus === "PUBLISHED" ? "已發布" : "草稿已儲存");
			if (data.page) {
				setForm((prev) => ({
					...prev,
					id: data.page.id,
					status: data.page.status,
					hasPreviousSnapshot: data.page.previousSnapshot != null,
				}));
			}
			await loadData();
		} catch (error) {
			toastError(error instanceof Error ? error.message : "儲存失敗");
		} finally {
			setSaving(false);
		}
	}

	async function handleRestore() {
		if (!form.id) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/pages-cms/${form.id}/restore`, { method: "POST" });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data.error ?? `HTTP ${res.status}`);
			}
			const page = data.page as PageRecord;
			openEdit(page);
			toastSuccess("已還原上一版");
			await loadData();
		} catch (error) {
			toastError(error instanceof Error ? error.message : "還原失敗");
		} finally {
			setSaving(false);
		}
	}

	async function handleArchive(page: PageRecord) {
		try {
			const res = await fetch(`/api/pages-cms/${page.id}`, { method: "DELETE" });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toastSuccess("已下架");
			await loadData();
		} catch {
			toastError("下架失敗");
		}
	}

	if (view === "form") {
		return (
			<div className="max-w-3xl space-y-4" data-testid="pages-cms-form">
				<Button variant="ghost" size="sm" onClick={() => setView("list")}>
					← 返回列表
				</Button>

				<Card>
					<CardHeader>
						<CardTitle>{form.id ? `編輯：${form.title || "未命名"}` : "新增內容"}</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4">
						{warnings.length > 0 ? (
							<div
								className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
								data-testid="pages-cms-warnings"
								role="status"
							>
								內容已清洗，以下項目被移除：{warnings.join("、")}
							</div>
						) : null}

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-1">
								<Label htmlFor="pages-cms-type">類型</Label>
								<select
									id="pages-cms-type"
									data-testid="pages-cms-type"
									value={form.type}
									onChange={(event) => setForm({ ...form, type: event.target.value as ContentType })}
									className="border-input bg-card h-9 w-full rounded-xl border px-3 text-sm"
								>
									<option value="POST">文章</option>
									<option value="PAGE">頁面</option>
								</select>
							</div>
							<div className="space-y-1">
								<Label htmlFor="pages-cms-locale">語系</Label>
								<select
									id="pages-cms-locale"
									data-testid="pages-cms-locale"
									value={form.locale}
									onChange={(event) => setForm({ ...form, locale: event.target.value as LocaleCode })}
									className="border-input bg-card h-9 w-full rounded-xl border px-3 text-sm"
								>
									<option value="zh-tw">繁體中文</option>
									<option value="zh-cn">简体中文</option>
									<option value="en">English</option>
								</select>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-1">
								<Label htmlFor="pages-cms-title">標題 *</Label>
								<Input
									id="pages-cms-title"
									data-testid="pages-cms-title"
									value={form.title}
									onChange={(event) => setForm({ ...form, title: event.target.value })}
									required
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="pages-cms-slug">Slug *</Label>
								<Input
									id="pages-cms-slug"
									data-testid="pages-cms-slug"
									value={form.slug}
									onChange={(event) => setForm({ ...form, slug: event.target.value })}
									className="font-mono"
									required
								/>
							</div>
						</div>

						<div className="space-y-1">
							<Label htmlFor="pages-cms-body">內文</Label>
							<Textarea
								id="pages-cms-body"
								data-testid="pages-cms-body"
								value={form.body}
								onChange={(event) => setForm({ ...form, body: event.target.value })}
								rows={12}
							/>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-1">
								<Label htmlFor="pages-cms-seo-title">SEO 標題</Label>
								<Input
									id="pages-cms-seo-title"
									data-testid="pages-cms-seo-title"
									value={form.seoTitle}
									onChange={(event) => setForm({ ...form, seoTitle: event.target.value })}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="pages-cms-cover">封面圖網址</Label>
								<Input
									id="pages-cms-cover"
									data-testid="pages-cms-cover"
									value={form.coverImageUrl}
									onChange={(event) => setForm({ ...form, coverImageUrl: event.target.value })}
								/>
							</div>
						</div>

						<div className="space-y-1">
							<Label htmlFor="pages-cms-seo-description">SEO 描述</Label>
							<Textarea
								id="pages-cms-seo-description"
								data-testid="pages-cms-seo-description"
								value={form.seoDescription}
								onChange={(event) => setForm({ ...form, seoDescription: event.target.value })}
								rows={3}
							/>
						</div>

						<p className="text-muted-foreground text-xs">還原僅能回到上一次儲存前的內容，不是完整版本歷史。</p>

						<div className="border-border flex flex-wrap items-center justify-between gap-2 border-t pt-3">
							<Button
								type="button"
								variant="outline"
								data-testid="pages-cms-restore"
								disabled={!form.id || !form.hasPreviousSnapshot || saving}
								onClick={() => void handleRestore()}
							>
								還原上一版
							</Button>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									data-testid="pages-cms-save-draft"
									loading={saving}
									onClick={() => void handleSave("DRAFT")}
								>
									儲存草稿
								</Button>
								<Button
									type="button"
									data-testid="pages-cms-publish"
									loading={saving}
									onClick={() => void handleSave("PUBLISHED")}
								>
									發布
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-4" data-testid="pages-cms-page">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-xl font-bold">頁面管理</h1>
					<p className="text-muted-foreground text-sm">管理網站頁面與文章，儲存後立即生效，不需重新部署。</p>
				</div>
				<Button data-testid="pages-cms-new" onClick={openNew}>
					新增內容
				</Button>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>標題</TableHead>
							<TableHead>類型</TableHead>
							<TableHead>語系</TableHead>
							<TableHead>狀態</TableHead>
							<TableHead className="text-right">操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading && (
							<TableRow>
								<TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
									載入中…
								</TableCell>
							</TableRow>
						)}
						{!loading && pages.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
									尚無內容，點右上角「新增內容」建立第一筆
								</TableCell>
							</TableRow>
						)}
						{pages.map((page) => (
							<TableRow key={page.id} data-testid="pages-cms-row">
								<TableCell>
									<div className="font-semibold">{page.title}</div>
									<div className="text-muted-foreground font-mono text-xs">/{page.slug}</div>
								</TableCell>
								<TableCell>{TYPE_LABEL[page.type]}</TableCell>
								<TableCell>{page.locale}</TableCell>
								<TableCell>
									<Badge status={STATUS_BADGE[page.status]}>{STATUS_LABEL[page.status]}</Badge>
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-1">
										<Button variant="ghost" size="sm" onClick={() => openEdit(page)}>
											編輯
										</Button>
										<Button variant="ghost" size="sm" onClick={() => void handleArchive(page)}>
											下架
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}
