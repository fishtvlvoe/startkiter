"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Button, Card, Input } from "@startkiter/ui";
import { useEffect, useState } from "react";

type MediaItem = {
	id: string;
	type: "VIDEO" | "IMAGE";
	provider: string | null;
	sourceId: string | null;
	url: string;
	filename: string | null;
	mimeType: string | null;
	size: number | null;
	usageType: "MANUAL" | "LESSON_CONTENT" | "COURSE_COVER";
	usageId: string | null;
	createdAt: string | Date;
	user?: { name: string; email: string };
};

export default function AdminMediaPage() {
	const [items, setItems] = useState<MediaItem[]>([]);
	const [search, setSearch] = useState("");
	const [type, setType] = useState<"ALL" | "VIDEO" | "IMAGE">("ALL");
	const [status, setStatus] = useState<string | null>(null);

	async function load() {
		const result = await orpcClient.course.listMedia({ type: type === "ALL" ? undefined : type, search: search.trim() || undefined, page: 1 });
		setItems(result.media as MediaItem[]);
	}

	useEffect(() => {
		void load().catch(() => setStatus("媒體庫載入失敗。"));
	}, [type, search]);

	async function remove(item: MediaItem) {
		if (item.usageId) return;
		try {
			await orpcClient.course.deleteMedia({ id: item.id });
			setStatus("媒體已刪除。 ");
			await load();
		} catch {
			setStatus("媒體刪除失敗。 ");
		}
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6" data-testid="media-library-page">
			<div>
				<h1 className="text-2xl font-semibold">媒體庫</h1>
				<p className="mt-1 text-sm text-muted-foreground">集中管理課程影片與圖片，查看引用來源；使用中的媒體不能刪除。</p>
			</div>
			<Card className="flex flex-wrap gap-3 p-4">
				<Input aria-label="搜尋媒體" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋檔名、網址或 provider" className="min-w-64 flex-1" />
				<select aria-label="媒體類型" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="rounded-md border bg-card px-3 py-2 text-sm">
					<option value="ALL">全部類型</option>
					<option value="VIDEO">影片</option>
					<option value="IMAGE">圖片</option>
				</select>
			</Card>
			{status ? <p className="text-sm text-muted-foreground" role="status">{status}</p> : null}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{items.map((item) => (
					<Card className="space-y-3 p-4" key={item.id} data-testid="media-library-item">
						{item.type === "IMAGE" ? <img src={`/image-proxy/${item.url}`} alt={item.filename ?? "課程圖片"} className="h-36 w-full rounded object-cover" /> : <div className="flex h-36 items-center justify-center rounded bg-neutral-900 text-4xl">▶</div>}
						<div className="space-y-1 text-sm">
							<p className="font-medium">{item.filename ?? `${item.provider ?? "影片"} 媒體`}</p>
							<p className="truncate text-xs text-muted-foreground">{item.url}</p>
							<p className="text-xs text-muted-foreground">類型：{item.type} · provider：{item.provider ?? "IMAGE"}</p>
							<p className="text-xs text-muted-foreground">引用：{item.usageId ? `${item.usageType} / ${item.usageId}` : "未引用"}</p>
						</div>
						<Button type="button" variant="outline" disabled={Boolean(item.usageId)} onClick={() => void remove(item)} title={item.usageId ? "使用中的媒體不能刪除" : undefined}>
							{item.usageId ? "使用中，無法刪除" : "刪除"}
						</Button>
					</Card>
				))}
				{items.length === 0 ? <p className="text-sm text-muted-foreground">目前沒有媒體。</p> : null}
			</div>
		</div>
	);
}
