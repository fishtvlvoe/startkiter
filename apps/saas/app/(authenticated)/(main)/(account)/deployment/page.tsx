import { getSession } from "@auth/lib/server";
import {
	fetchCoolifyAppStatus,
	findBuyerDeploymentForUser,
	buildStatusPanelView,
	type StatusPanelView,
} from "@startkiter/platform";
import { Card } from "@startkiter/ui";
import { redirect } from "next/navigation";

async function loadStatusPanelView(userId: string): Promise<StatusPanelView | null> {
	const deployment = await findBuyerDeploymentForUser(userId);
	if (!deployment) {
		return null;
	}

	const coolifyApiToken = process.env.COOLIFY_API_TOKEN;
	if (!coolifyApiToken || !deployment.coolifyAppId) {
		return { reachable: "unavailable", publicUrl: deployment.publicUrl, lastDeployedAt: deployment.lastDeployedAt };
	}

	const probe = await fetchCoolifyAppStatus(deployment.coolifyAppId, coolifyApiToken);
	return buildStatusPanelView(deployment, probe);
}

function StatusBadge({ view }: { view: StatusPanelView }) {
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

export default async function DeploymentPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const view = await loadStatusPanelView(session.user.id);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold">我的網站</h1>
				<p className="text-muted-foreground mt-1">你的開站包目前的運作狀態</p>
			</div>

			<Card className="flex flex-col gap-6 p-7">
				{view ? (
					<>
						<StatusBadge view={view} />

						{view.reachable === "unavailable" && (
							<div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
								系統暫時查不到最新狀態，通常幾分鐘內會恢復。你的網站很可能還在正常運作，不用擔心。
							</div>
						)}
						{view.reachable === false && (
							<div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
								你可以聯絡我們協助排查，或稍後重新整理再確認一次。
							</div>
						)}

						<div className="flex flex-col gap-3.5">
							<div className="border-border flex flex-col gap-1 border-t pt-3.5">
								<span className="text-muted-foreground text-[11.5px] font-semibold tracking-wide uppercase">
									網址
								</span>
								<a
									href={view.publicUrl}
									target="_blank"
									rel="noreferrer"
									className="border-border w-fit border-b text-[15px] font-medium break-all"
								>
									{view.publicUrl}
								</a>
							</div>
							{view.lastDeployedAt && (
								<div className="border-border flex flex-col gap-1 border-t pt-3.5">
									<span className="text-muted-foreground text-[11.5px] font-semibold tracking-wide uppercase">
										上次更新
									</span>
									<span className="text-[15px] font-medium">
										{new Date(view.lastDeployedAt).toLocaleString("zh-TW")}
									</span>
								</div>
							)}
						</div>
					</>
				) : (
					<p className="text-muted-foreground">
						目前還沒有偵測到你的部署。完成部署設定後，這裡會顯示你網站的運作狀態。
					</p>
				)}
			</Card>
		</div>
	);
}
