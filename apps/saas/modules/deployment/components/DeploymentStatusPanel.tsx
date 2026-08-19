import type { StatusPanelView } from "@startkiter/platform";
import { Card } from "@startkiter/ui/components/card";
import { ExternalLink, Mail } from "lucide-react";
import { ReportIssueButton } from "./ReportIssueButton";

export function StatusBadge({ view }: { view: StatusPanelView }) {
	if (view.reachable === "unavailable") {
		return (
			<div className="flex items-center gap-3">
				<span className="size-3 flex-none rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]" />
				<div>
					<p className="font-semibold text-amber-600 dark:text-amber-400">狀態暫時無法取得</p>
					<p className="text-muted-foreground text-sm">我們正在重新確認，這不代表你的網站掛了</p>
				</div>
			</div>
		);
	}
	if (view.reachable === true) {
		return (
			<div className="flex items-center gap-3">
				<span className="size-3 flex-none rounded-full bg-green-600 shadow-[0_0_0_4px_rgba(22,101,52,0.12)]" />
				<div>
					<p className="font-semibold text-green-700 dark:text-green-400">網站正常運作中</p>
					<p className="text-muted-foreground text-sm">訪客現在可以正常瀏覽你的網站</p>
				</div>
			</div>
		);
	}
	return (
		<div className="flex items-center gap-3">
			<span className="size-3 flex-none rounded-full bg-red-600 shadow-[0_0_0_4px_rgba(185,28,28,0.12)]" />
			<div>
				<p className="font-semibold text-red-700 dark:text-red-400">網站部署失敗</p>
				<p className="text-muted-foreground text-sm">最新一次更新沒有成功，訪客可能看到舊版本</p>
			</div>
		</div>
	);
}

export function DeploymentStatusPanel({
	view,
	supportEmail = process.env.SUPPORT_EMAIL || "support@startkiter.com",
}: {
	view: StatusPanelView;
	supportEmail?: string;
}) {
	return (
		<Card className="flex flex-col gap-6 p-7">
			<StatusBadge view={view} />

			{view.reachable === "unavailable" && (
				<div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 space-y-3">
					<p>
						系統暫時查不到最新狀態，通常幾分鐘內會自動恢復。你的網站很可能還在正常運作，不用擔心。
					</p>
					<div className="flex flex-wrap items-center gap-3 pt-1">
						<ReportIssueButton buyerDeploymentId={view.deploymentId} variant="outline" size="sm" />
						<a
							href={`mailto:${supportEmail}?subject=【開站包】部署狀態查詢問題`}
							className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-100/70 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200/70 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200 transition"
						>
							<Mail className="h-3.5 w-3.5" /> 聯絡技術支援
						</a>
					</div>
				</div>
			)}

			{view.reachable === false && (
				<div className="rounded-lg border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 space-y-3">
					<p>
						檢測到你的網站目前可能未正常上線。你可以聯絡我們協助排查，或稍後重新整理再確認一次。
					</p>
					<div className="flex flex-wrap items-center gap-3 pt-1">
						<ReportIssueButton buyerDeploymentId={view.deploymentId} variant="destructive" size="sm" />
						<a
							href={`mailto:${supportEmail}?subject=【開站包】網站部署失敗協助排查`}
							className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-100/70 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-200/70 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200 transition"
						>
							<Mail className="h-3.5 w-3.5" /> 聯絡技術支援
						</a>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-3.5">
				<div className="border-border flex flex-col gap-1 border-t pt-3.5">
					<span className="text-muted-foreground text-[11.5px] font-semibold tracking-wide uppercase">
						網站網址
					</span>
					<a
						href={view.publicUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-primary hover:underline w-fit text-[15px] font-medium break-all"
					>
						{view.publicUrl} <ExternalLink className="h-3.5 w-3.5" />
					</a>
				</div>
				{view.lastDeployedAt && (
					<div className="border-border flex flex-col gap-1 border-t pt-3.5">
						<span className="text-muted-foreground text-[11.5px] font-semibold tracking-wide uppercase">
							上次更新時間
						</span>
						<span className="text-[15px] font-medium">
							{new Date(view.lastDeployedAt).toLocaleString("zh-TW")}
						</span>
					</div>
				)}
			</div>

			<div className="border-border flex items-center justify-between border-t pt-4">
				<div>
					<p className="text-sm font-medium">需要專人協助？</p>
					<p className="text-muted-foreground text-xs">開啟客服對話並自動帶入此網站部署資訊</p>
				</div>
				<ReportIssueButton buyerDeploymentId={view.deploymentId} size="sm" />
			</div>
		</Card>
	);
}
