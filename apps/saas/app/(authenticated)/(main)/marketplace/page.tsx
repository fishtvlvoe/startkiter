import { getSession } from "@auth/lib/server";
import { AppWrapper } from "@shared/components/AppWrapper";
import { MOUNT_POINTS } from "@startkiter/platform/src/mount-points";
import { SITE_TEMPLATES } from "@startkiter/platform/src/templates";
import { redirect } from "next/navigation";

import { MarketplaceClient } from "./marketplace-client";

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

	return (
		<AppWrapper>
			<div className="container max-w-5xl py-8">
				<MarketplaceClient
					initialPlugins={initialPlugins}
					initialTemplates={SITE_TEMPLATES}
				/>
			</div>
		</AppWrapper>
	);
}
