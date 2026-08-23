import { db } from "@startkiter/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@startkiter/ui";

import { SubscriptionCheckoutForm } from "@payments/components/SubscriptionCheckoutForm";

export default async function PayuniSubscriptionCheckoutPage() {
	const plans = await db.courseSubscriptionPlan.findMany({
		where: { enabled: true },
		include: { course: { select: { title: true } } },
		orderBy: [{ courseId: "asc" }, { price: "asc" }],
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>PAYUNi 訂閱方案</CardTitle>
				<CardDescription>選擇月繳或年繳，訂閱成功後即可使用對應課程。</CardDescription>
			</CardHeader>
			<CardContent>
				<SubscriptionCheckoutForm
					plans={plans.map((plan) => ({
						id: plan.id,
						label: plan.label,
						interval: plan.interval,
						price: plan.price,
						courseTitle: plan.course.title,
					}))}
				/>
			</CardContent>
		</Card>
	);
}
