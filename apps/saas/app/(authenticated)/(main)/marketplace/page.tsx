import { getSession } from "@auth/lib/server";
import { AppWrapper } from "@shared/components/AppWrapper";
import { MOUNT_POINTS } from "@startkiter/platform/src/mount-points";
import { SITE_TEMPLATES } from "@startkiter/platform/src/templates";
import { createGithubVersionFileReader, getRepoVersion } from "@startkiter/github-kit";
import { redirect } from "next/navigation";

import { createPrismaGrantStore, loadGithubKitRuntime } from "../../../../lib/github-kit";
import { MarketplaceClient } from "./marketplace-client";
import type { RepoVersionSectionData } from "./marketplace-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MarketplacePage() {
	const session = await getSession();

	if (!session) {
		redirect("/login?next=/marketplace");
	}

	const initialPlugins = MOUNT_POINTS.map((plugin) => ({
		...plugin,
		enabled: true as const,
	}));

	// 讀取型操作：僅比對 STARTKITER_VERSION，不建立排程/webhook，也不主動寫入買家倉庫
	// （spec buyer-repo-upstream-sync「Repository synchronization is buyer-triggered only」）。
	const { config } = loadGithubKitRuntime();
	const versions = config
		? createGithubVersionFileReader(config)
		: { readStartkiterVersion: async () => null };
	const versionResult = await getRepoVersion({
		userId: session.user.id,
		config,
		grants: createPrismaGrantStore(),
		versions,
	});
	const initialVersion: RepoVersionSectionData = versionResult.ok
		? versionResult.body
		: { buyerVersion: "", latestVersion: "", upToDate: null, syncPromptHint: "" };

	return (
		<AppWrapper>
			<div className="container max-w-5xl py-8">
				<MarketplaceClient
					initialPlugins={initialPlugins}
					initialTemplates={SITE_TEMPLATES}
					initialVersion={initialVersion}
				/>
			</div>
		</AppWrapper>
	);
}
