"use client";

import { Button } from "@startkiter/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@startkiter/ui/components/dialog";
import { Input } from "@startkiter/ui/components/input";
import { Textarea } from "@startkiter/ui/components/textarea";
import { toastError, toastSuccess } from "@startkiter/ui/components/toast";
import { useState } from "react";

type TargetUser = {
	id: string;
	name: string | null;
	email: string;
};

type SendNotificationDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: TargetUser | null;
};

export function SendNotificationDialog({
	open,
	onOpenChange,
	user,
}: SendNotificationDialogProps) {
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);

	if (!user) return null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!user) return;

		const trimmedTitle = title.trim();
		const trimmedMessage = message.trim();

		if (!trimmedTitle || trimmedTitle.length > 120) {
			toastError("標題長度需在 1 到 120 字之間");
			return;
		}

		if (!trimmedMessage || trimmedMessage.length > 500) {
			toastError("內文長度需在 1 到 500 字之間");
			return;
		}

		setSending(true);
		try {
			const res = await fetch("/api/admin/notifications", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: user.id,
					title: trimmedTitle,
					message: trimmedMessage,
				}),
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || `HTTP ${res.status}`);
			}

			const data = await res.json();
			if (data.created) {
				toastSuccess("站內通知已發送");
			} else {
				toastSuccess("使用者已關閉站內更新通知，未插入通知列");
			}

			setTitle("");
			setMessage("");
			onOpenChange(false);
		} catch (err: any) {
			toastError(err.message || "發送通知失敗");
		} finally {
			setSending(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>發送站內更新通知</DialogTitle>
					<DialogDescription>
						對使用者 {user.name || user.email} 發送一則 APP_UPDATE 站內通知。
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="text-sm font-medium" htmlFor="notif-title">
							通知標題 * <span className="text-xs text-muted-foreground">(最多 120 字)</span>
						</label>
						<Input
							id="notif-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength={120}
							required
							placeholder="例如：系統維護通知"
						/>
					</div>

					<div className="space-y-1">
						<label className="text-sm font-medium" htmlFor="notif-message">
							通知內容 * <span className="text-xs text-muted-foreground">(最多 500 字)</span>
						</label>
						<Textarea
							id="notif-message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							maxLength={500}
							rows={4}
							required
							placeholder="請輸入通知詳細內容..."
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={sending}
						>
							取消
						</Button>
						<Button type="submit" loading={sending}>
							發送通知
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
