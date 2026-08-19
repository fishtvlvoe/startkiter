import { getSession } from "@auth/lib/server";
import {
	fetchCoolifyAppStatus,
	findBuyerDeploymentForUser,
	buildStatusPanelView,
	type StatusPanelView,
} from "@startkiter/platform";
import { redirect } from "next/navigation";
import { DeploymentStatusPanel } from "@deployment/components/DeploymentStatusPanel";
import { TierSelector } from "@deployment/components/TierSelector";

async function loadStatusPanelView(userId: string): Promise<StatusPanelView | null> {
	const deployment = await findBuyerDeploymentForUser(userId);
	if (!deployment) {
		return null;
	}

	const coolifyApiToken = process.env.COOLIFY_API_TOKEN;
	if (!coolifyApiToken || !deployment.coolifyAppId) {
		return {
			reachable: "unavailable",
			publicUrl: deployment.publicUrl,
			lastDeployedAt: deployment.lastDeployedAt,
			deploymentId: deployment.id,
		};
	}

	const probe = await fetchCoolifyAppStatus(deployment.coolifyAppId, coolifyApiToken);
	return buildStatusPanelView(deployment, probe);
}

export default async function DeploymentPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const view = await loadStatusPanelView(session.user.id);

	return (
		<div className="space-y-6 max-w-4xl">
			<div>
				<h1 className="text-2xl font-semibold">我的網站</h1>
				<p className="text-muted-foreground mt-1 text-sm">你的開站包目前的運作與部署狀態</p>
			</div>

			{view ? (
				<DeploymentStatusPanel view={view} />
			) : (
				<div className="space-y-6">
					<div className="rounded-lg border bg-card p-6 shadow-sm">
						<h2 className="text-lg font-semibold">選擇你的上線方式</h2>
						<p className="text-muted-foreground mt-1 text-sm leading-relaxed">
							歡迎使用 StartKiter 開站包！請選擇適合你的部署模式，我們將引導你快速完成環境設定與網站上線。
						</p>
					</div>

					<TierSelector />
				</div>
			)}
		</div>
	);
}
