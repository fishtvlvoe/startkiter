import { getSession } from "@auth/lib/server";
import { SubscriptionCancellationList } from "@payments/components/SubscriptionCancellationList";
import { db } from "@startkiter/database";
import { ActivePlan } from "@payments/components/ActivePlan";
import { ChangePlan } from "@payments/components/ChangePlan";
import { listPurchases } from "@payments/lib/server";
import { createPurchasesHelper } from "@startkiter/payments/lib/helper";
import { PageHeader } from "@shared/components/PageHeader";
import { SettingsList } from "@shared/components/SettingsList";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { getTranslations } from "next-intl/server";

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
				<ChangePlan userId={session?.user.id} activePlanId={activePlan?.id} />
			</SettingsList>
		</>
	);
}
