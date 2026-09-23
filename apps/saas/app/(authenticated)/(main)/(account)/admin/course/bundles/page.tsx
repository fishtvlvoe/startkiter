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

type BundleStatus = "draft" | "published" | "archived";

type Bundle = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	priceTwd: number;
	status: BundleStatus;
	courseIds: string[];
};

type CourseOption = { id: string; title: string };

type BundleFormState = {
	id: string | null;
	slug: string;
	title: string;
	description: string;
	priceTwd: string;
	status: BundleStatus;
	courseIds: string[];
};

const EMPTY_FORM: BundleFormState = {
	id: null,
	slug: "",
	title: "",
	description: "",
	priceTwd: "",
	status: "draft",
	courseIds: [],
};

const STATUS_LABEL: Record<BundleStatus, string> = {
	draft: "草稿",
	published: "已發布",
	archived: "已下架",
};

const STATUS_BADGE_VARIANT: Record<BundleStatus, "info" | "success" | "error"> = {
	draft: "info",
	published: "success",
	archived: "error",
};

function PackageIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="4" y="12" width="7" height="7" />
			<rect x="13" y="12" width="7" height="7" />
			<rect x="8.5" y="4" width="7" height="7" />
		</svg>
	);
}

function PenIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5" />
			<path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
		</svg>
	);
}

function TrashIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M4 7h16" />
			<path d="M9 7V4h6v3" />
			<path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" />
		</svg>
	);
}

export default function AdminBundlesPage() {
	const [bundles, setBundles] = useState<Bundle[]>([]);
	const [courses, setCourses] = useState<CourseOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<"list" | "form">("list");
	const [form, setForm] = useState<BundleFormState>(EMPTY_FORM);
	const [saving, setSaving] = useState(false);

	async function loadData() {
		setLoading(true);
		try {
			const res = await fetch("/api/bundles/admin");
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			setBundles(data.bundles ?? []);
			setCourses(data.courses ?? []);
		} catch {
			toastError("載入組合包資料失敗");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadData();
	}, []);

	function openNewBundle() {
		setForm(EMPTY_FORM);
		setView("form");
	}

	function openEditBundle(bundle: Bundle) {
		setForm({
			id: bundle.id,
			slug: bundle.slug,
			title: bundle.title,
			description: bundle.description ?? "",
			priceTwd: String(bundle.priceTwd),
			status: bundle.status,
			courseIds: bundle.courseIds,
		});
		setView("form");
	}

	async function handleDelete(bundle: Bundle) {
		if (!confirm(`確定要刪除組合包《${bundle.title}》嗎？`)) return;
		try {
			const res = await fetch(`/api/bundles/${bundle.id}`, { method: "DELETE" });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			toastSuccess("組合包已刪除");
			await loadData();
		} catch {
			toastError("刪除失敗");
		}
	}

	function toggleCourse(courseId: string) {
		setForm((prev) => ({
			...prev,
			courseIds: prev.courseIds.includes(courseId)
				? prev.courseIds.filter((id) => id !== courseId)
				: [...prev.courseIds, courseId],
		}));
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		const priceTwd = Number.parseInt(form.priceTwd, 10);
		if (!form.title.trim() || !form.slug.trim() || form.courseIds.length === 0 || !Number.isFinite(priceTwd)) {
			toastError("標題、Slug、至少選一堂課、組合價為必填");
			return;
		}

		setSaving(true);
		try {
			const body = {
				slug: form.slug.trim(),
				title: form.title.trim(),
				description: form.description.trim() || null,
				priceTwd,
				status: form.status,
				courseIds: form.courseIds,
			};

			const res = form.id
				? await fetch(`/api/bundles/${form.id}`, {
						method: "PUT",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(body),
					})
				: await fetch("/api/bundles", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(body),
					});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error ?? `HTTP ${res.status}`);
			}

			toastSuccess("組合包已儲存");
			setView("list");
			await loadData();
		} catch {
			toastError("儲存失敗，請確認欄位是否正確");
		} finally {
			setSaving(false);
		}
	}

	if (view === "form") {
		return (
			<div className="max-w-2xl space-y-4">
				<Button variant="ghost" size="sm" onClick={() => setView("list")}>
					← 返回列表
				</Button>

				<Card>
					<CardHeader>
						<CardTitle>{form.id ? `編輯組合包：${form.title}` : "新增組合包"}</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-1">
									<Label>標題 *</Label>
									<Input
										value={form.title}
										onChange={(e) => setForm({ ...form, title: e.target.value })}
										placeholder="例如：Next.js 全端班 + React 進階班"
										required
									/>
								</div>
								<div className="space-y-1">
									<Label>Slug *</Label>
									<Input
										value={form.slug}
										onChange={(e) => setForm({ ...form, slug: e.target.value })}
										placeholder="fullstack-combo"
										className="font-mono"
										required
									/>
									<p className="text-muted-foreground text-xs">
										前台網址：/bundles/{form.slug || "<slug>"}
									</p>
								</div>
							</div>

							<div className="space-y-1">
								<Label>說明</Label>
								<Textarea
									value={form.description}
									onChange={(e) => setForm({ ...form, description: e.target.value })}
									placeholder="這個組合包適合誰、能省多少錢"
									rows={3}
								/>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-1">
									<Label>組合價 (TWD) *</Label>
									<Input
										type="number"
										min={0}
										step={1}
										value={form.priceTwd}
										onChange={(e) => setForm({ ...form, priceTwd: e.target.value })}
										className="font-mono"
										required
									/>
								</div>
								<div className="space-y-1">
									<Label>狀態</Label>
									<select
										value={form.status}
										onChange={(e) => setForm({ ...form, status: e.target.value as BundleStatus })}
										className="border-input bg-card h-9 w-full rounded-xl border px-3 text-sm"
									>
										<option value="draft">草稿（不對外顯示）</option>
										<option value="published">已發布（前台可購買）</option>
										<option value="archived">已下架</option>
									</select>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label>
									內含課程 * <span className="text-muted-foreground font-normal">（至少選 1 堂）</span>
								</Label>
								<div className="divide-border rounded-xl border divide-y">
									{courses.map((course) => (
										<label
											key={course.id}
											className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-foreground/5"
										>
											<input
												type="checkbox"
												checked={form.courseIds.includes(course.id)}
												onChange={() => toggleCourse(course.id)}
												className="accent-primary size-3.5"
											/>
											<span>{course.title}</span>
											<span className="text-muted-foreground ml-auto font-mono text-[11px]">
												{course.id}
											</span>
										</label>
									))}
									{courses.length === 0 && (
										<p className="text-muted-foreground px-3 py-4 text-sm">目前沒有可選課程</p>
									)}
								</div>
							</div>

							<div className="border-border flex items-center justify-between border-t pt-3">
								<Button type="button" variant="outline" onClick={() => setView("list")}>
									取消
								</Button>
								<Button type="submit" loading={saving}>
									儲存組合包
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-xl font-bold">課程綁定包</h1>
					<p className="text-muted-foreground text-sm">把多堂課組成一個組合價商品，可套用優惠券折扣。</p>
				</div>
				<Button onClick={openNewBundle}>
					<PackageIcon className="size-4" />
					新增組合包
				</Button>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>組合包</TableHead>
							<TableHead>內含課程</TableHead>
							<TableHead>組合價</TableHead>
							<TableHead>狀態</TableHead>
							<TableHead className="text-right">操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading && (
							<TableRow>
								<TableCell colSpan={5} className="text-muted-foreground text-center py-8">
									載入中…
								</TableCell>
							</TableRow>
						)}
						{!loading && bundles.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="text-muted-foreground text-center py-8">
									尚無組合包，點右上角「新增組合包」建立第一個
								</TableCell>
							</TableRow>
						)}
						{bundles.map((bundle) => (
							<TableRow key={bundle.id}>
								<TableCell>
									<div className="font-semibold">{bundle.title}</div>
									<div className="text-muted-foreground font-mono text-xs">/{bundle.slug}</div>
								</TableCell>
								<TableCell>
									<span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 font-mono text-xs">
										{bundle.courseIds.length} 堂課
									</span>
								</TableCell>
								<TableCell className="font-semibold">NT$ {bundle.priceTwd.toLocaleString()}</TableCell>
								<TableCell>
									<Badge status={STATUS_BADGE_VARIANT[bundle.status]}>
										{STATUS_LABEL[bundle.status]}
									</Badge>
								</TableCell>
								<TableCell className="text-right">
									<div className="flex items-center justify-end gap-1">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => openEditBundle(bundle)}
											title="編輯組合包"
										>
											<PenIcon className="size-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(bundle)}
											title="刪除組合包"
										>
											<TrashIcon className="size-3.5" />
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
