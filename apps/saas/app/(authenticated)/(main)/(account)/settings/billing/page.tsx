import { getSession } from "@auth/lib/server";
import { SubscriptionCancellationList } from "@payments/components/SubscriptionCancellationList";
import { db } from "@startkiter/database";
import { ActivePlan } from "@payments/components/ActivePlan";
import { listPurchases } from "@payments/lib/server";
import { createPurchasesHelper } from "@startkiter/payments/lib/helper";
import { PageHeader } from "@shared/components/PageHeader";
import { SettingsItem } from "@shared/components/SettingsItem";
import { SettingsList } from "@shared/components/SettingsList";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { userHasCourseAccess } from "../../../../../../lib/course-access";

export async function generateMetadata() {
	const t = await getTranslations("settings.billing");

	return {
		title: t("title"),
	};
}

export default async function BillingSettingsPage() {
	const session = await getSession();
	const purchases = await listPurchases();
	const subscriptions = session
		? await db.courseSubscription.findMany({
				where: { userId: session.user.id },
				include: { course: { select: { title: true } }, plan: { select: { label: true } } },
				orderBy: { createdAt: "desc" },
			})
		: [];

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: orpc.payments.listPurchases.queryKey({
			input: {},
		}),
		queryFn: () => purchases,
	});

	const { activePlan } = createPurchasesHelper(purchases);

	const entitled = session ? await userHasCourseAccess(session.user.id) : false;

	const t = await getTranslations("settings.billing");

	return (
		<>
			<PageHeader title={t("title")} subtitle={t("changePlan.description")} />

			<SettingsList>
				{activePlan && <ActivePlan />}
				<SubscriptionCancellationList
					subscriptions={subscriptions.map((subscription) => ({
						id: subscription.id,
						courseTitle: subscription.course.title,
						label: subscription.plan.label,
						interval: subscription.interval,
						price: subscription.pricePerPeriod,
						status: subscription.status,
					}))}
				/>
				{entitled ? (
					<SettingsItem
						title={t("changePlan.title")}
						description={t("changePlan.description")}
					>
						<div className="space-y-4" data-testid="billing-owned-state">
							<p className="text-sm text-muted-foreground">
								你已擁有開站包，可直接進入課程與領取代碼包。
							</p>
							<Link
								className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors"
								href="/course"
							>
								進入課程
							</Link>
						</div>
					</SettingsItem>
				) : (
					<SettingsItem
						title={t("changePlan.title")}
						description={t("changePlan.description")}
					>
						<div className="space-y-4" data-testid="billing-checkout-entry">
							<p className="text-sm text-muted-foreground">
								尚未購買開站包，前往結帳頁完成購買即可解鎖課程與代碼包。
							</p>
							<Link
								className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors"
								href="/checkout"
							>
								前往結帳
							</Link>
						</div>
					</SettingsItem>
				)}
			</SettingsList>
		</>
	);
}
