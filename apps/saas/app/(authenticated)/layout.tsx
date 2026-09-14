import { SessionProvider } from "@auth/components/SessionProvider";
import { canAccessPagesCmsAdmin } from "@startkiter/api/modules/pages-cms/access";
import { sessionQueryKey } from "@auth/lib/api";
import { getOrganizationList, getSession } from "@auth/lib/server";
import { ActiveOrganizationProvider } from "@organizations/components/ActiveOrganizationProvider";
import { organizationListQueryKey } from "@organizations/lib/api";
import { listPurchases } from "@payments/lib/server";
import { config as authConfig } from "@startkiter/auth/config";
import { getOrganizationMembership } from "@startkiter/database";
import { config as paymentsConfig } from "@startkiter/payments/config";
import { ConfirmationAlertProvider } from "@shared/components/ConfirmationAlertProvider";
import { PermixProvider } from "@shared/components/PermixProvider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { setupPermissions, permix } from "@shared/lib/permix";
import { buildLoginRedirectUrl } from "@shared/lib/redirect";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { findBuyerDeploymentsForUser } from "@startkiter/platform";
import { SupportWidget } from "@deployment/components/SupportWidget";
import { PagesCmsAccessProvider } from "@shared/components/PagesCmsAccessProvider";
import type { PropsWithChildren } from "react";

import { ChatwootScript } from "./ChatwootScript";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthenticatedLayout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		const pathname = (await headers()).get("x-pathname");
		redirect(buildLoginRedirectUrl(pathname));
	}

	const queryClient = getServerQueryClient();

	const membershipPromise = session.session.activeOrganizationId
		? getOrganizationMembership(
				session.session.activeOrganizationId,
				session.user.id,
			)
		: Promise.resolve(null);

	const sessionPrefetchPromise = queryClient.prefetchQuery({
		queryKey: sessionQueryKey,
		queryFn: () => session,
	});

	const orgListPrefetchPromise = authConfig.organizations.enable
		? queryClient.prefetchQuery({
				queryKey: organizationListQueryKey,
				queryFn: getOrganizationList,
			})
		: Promise.resolve();

	const purchasesPrefetchPromise =
		paymentsConfig.billingAttachedTo === "user"
			? queryClient.prefetchQuery({
					queryKey: orpc.payments.listPurchases.queryKey({
						input: {},
					}),
					queryFn: () => listPurchases(),
				})
			: Promise.resolve();

	const buyerDeploymentsPromise = findBuyerDeploymentsForUser(session.user.id);

	const [membership, , , , buyerDeployments] = await Promise.all([
		membershipPromise,
		sessionPrefetchPromise,
		orgListPrefetchPromise,
		purchasesPrefetchPromise,
		buyerDeploymentsPromise,
	]);

	const membershipRole = membership?.role ?? null;

	setupPermissions({
		user: session.user,
		membershipRole,
	});

	const canAccessPagesCms = canAccessPagesCmsAdmin(session, process.env.ADMIN_EMAIL);
	const deployments = buyerDeployments.map((d) => ({
		id: d.id,
		publicUrl: d.publicUrl,
		tier: d.tier,
	}));

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<SessionProvider>
				<PermixProvider state={permix.dehydrate()}>
					<PagesCmsAccessProvider canAccessPagesCms={canAccessPagesCms}>
						<ActiveOrganizationProvider>
							<ConfirmationAlertProvider>
								{children}
								<ChatwootScript deployments={deployments} />
								<SupportWidget deployments={deployments} />
							</ConfirmationAlertProvider>
						</ActiveOrganizationProvider>
					</PagesCmsAccessProvider>
				</PermixProvider>
			</SessionProvider>
		</HydrationBoundary>
	);
}
