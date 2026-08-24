"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Button, Input } from "@startkiter/ui";
import { useEffect, useState } from "react";

export type MediaPickerType = "VIDEO" | "IMAGE";
export type MediaUsageType = "MANUAL" | "LESSON_CONTENT" | "COURSE_COVER";

export type MediaPickerValue = {
	id: string;
	type: MediaPickerType;
	provider: string | null;
	sourceId: string | null;
	url: string;
	filename: string | null;
	mimeType: string | null;
	size: number | null;
	usageType: MediaUsageType;
	usageId: string | null;
};

type MediaPickerProps = {
	type: MediaPickerType;
	usageType?: MediaUsageType;
	usageId?: string;
	value?: string | null;
	onSelect: (media: MediaPickerValue) => void;
};

export function MediaPicker({ type, usageType = "MANUAL", usageId, value, onSelect }: MediaPickerProps) {
	const [media, setMedia] = useState<MediaPickerValue[]>([]);
	const [search, setSearch] = useState("");
	const [videoUrl, setVideoUrl] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	async function loadMedia() {
		const result = await orpcClient.course.listMedia({ type, search: search.trim() || undefined, page: 1 });
		setMedia(result.media as MediaPickerValue[]);
	}

	useEffect(() => {
		void loadMedia().catch(() => setStatus("媒體庫載入失敗。"));
	}, [type, search]);

	async function registerVideo() {
		if (!videoUrl.trim()) return;
		setBusy(true);
		setStatus(null);
		try {
			const result = await orpcClient.course.registerMedia({
				type: "VIDEO",
				url: videoUrl.trim(),
				usageType,
				...(usageId ? { usageId } : {}),
			});
			onSelect(result as MediaPickerValue);
			setVideoUrl("");
			await loadMedia();
			setStatus("影片已登記到媒體庫。 ");
		} catch {
			setStatus("影片網址無法驗證。 ");
		} finally {
			setBusy(false);
		}
	}

	async function uploadImage() {
		if (!file) return;
		setBusy(true);
		setStatus(null);
		try {
			const preparation = await orpcClient.course.mediaUploadUrl({ filename: file.name, mimeType: file.type, size: file.size });
			const upload = await fetch(preparation.signedUploadUrl, {
				method: "PUT",
				headers: { "Content-Type": file.type, "If-None-Match": "*" },
				body: file,
			});
			if (!upload.ok) throw new Error("image upload failed");
			const result = await orpcClient.course.registerMedia({
				type: "IMAGE",
				path: preparation.path,
				filename: file.name,
				mimeType: file.type,
				size: file.size,
				usageType,
				...(usageId ? { usageId } : {}),
			});
			onSelect(result as MediaPickerValue);
			setFile(null);
			await loadMedia();
			setStatus("圖片已上傳並登記到媒體庫。 ");
		} catch {
			setStatus("圖片上傳或登記失敗。 ");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/40 p-3" data-testid="media-picker">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<p className="text-sm font-medium text-neutral-200">從媒體庫選擇{type === "VIDEO" ? "影片" : "圖片"}</p>
					<p className="text-xs text-neutral-400">可搜尋既有媒體，或在下方登記新來源。</p>
				</div>
				<Input aria-label="搜尋媒體庫" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋檔名、網址或 provider" className="max-w-xs text-xs" />
			</div>

			<div className="grid gap-2 sm:grid-cols-2">
				{media.map((item) => (
					<button
						type="button"
						key={item.id}
						onClick={() => {
							if (usageType === "COURSE_COVER" && usageId) {
								void orpcClient.course.setCourseCoverMedia({ courseId: usageId, mediaId: item.id }).then(() => onSelect(item)).catch(() => setStatus("課程封面設定失敗。 "));
								return;
							}
							onSelect(item);
						}}
						className={`rounded-md border p-2 text-left text-xs ${value === item.url ? "border-primary bg-primary/10" : "border-neutral-800 hover:border-primary/60"}`}
						data-testid={`media-option-${item.id}`}
					>
						{item.type === "IMAGE" ? <img src={`/image-proxy/${item.url}`} alt={item.filename ?? "媒體圖片"} className="mb-2 h-20 w-full rounded object-cover" /> : null}
						<span className="block font-medium">{item.filename ?? item.provider ?? "影片"}</span>
						<span className="block truncate text-neutral-400">{item.url}</span>
						<span className="block text-neutral-500">{item.usageId ? `使用中 · ${item.usageType}` : "未引用"}</span>
					</button>
				))}
				{media.length === 0 ? <p className="text-xs text-neutral-500">目前沒有符合條件的媒體。</p> : null}
			</div>

			{type === "VIDEO" ? (
				<div className="flex flex-wrap gap-2">
					<Input aria-label="登記影片網址" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="貼上 Bunny / YouTube / Vimeo / MP4 網址" className="min-w-64 flex-1 font-mono text-xs" />
					<Button type="button" variant="outline" onClick={() => void registerVideo()} disabled={busy || !videoUrl.trim()}>登記新影片</Button>
				</div>
			) : (
				<div className="flex flex-wrap items-center gap-2">
					<input aria-label="上傳媒體圖片" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="max-w-full text-xs" />
					<Button type="button" variant="outline" onClick={() => void uploadImage()} disabled={busy || !file}>上傳並登記圖片</Button>
				</div>
			)}

			{status ? <p className="text-xs text-neutral-300" role="status">{status}</p> : null}
		</div>
	);
}
