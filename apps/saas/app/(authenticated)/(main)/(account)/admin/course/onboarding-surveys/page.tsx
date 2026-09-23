import { getSession } from "@auth/lib/server";
import { isOperator } from "@startkiter/permissions";
import { db } from "@startkiter/database";
import { Card, CardContent, CardHeader, CardTitle } from "@startkiter/ui";
import { redirect } from "next/navigation";

function formatDate(value: Date): string {
	return value.toLocaleString("zh-TW", { dateStyle: "medium", timeStyle: "short" });
}

export default async function OnboardingSurveysPage() {
	const session = await getSession();
	if (!session) redirect("/login");
	if (!isOperator(session.user, process.env.ADMIN_EMAIL)) redirect("/");

	const [courses, responses] = await Promise.all([
		db.course.findMany({
			where: {
				OR: [
					{ status: "PUBLISHED" },
					{ onboardingSurveyResponses: { some: {} } },
				],
			},
			orderBy: { title: "asc" },
			select: { id: true, title: true },
		}),
		db.courseOnboardingSurveyResponse.findMany({
			orderBy: { createdAt: "desc" },
			take: 500,
			include: { user: { select: { email: true, name: true } } },
		}),
	]);

	const responsesByCourse = new Map<string, typeof responses>();
	for (const response of responses) {
		const current = responsesByCourse.get(response.courseId) ?? [];
		current.push(response);
		responsesByCourse.set(response.courseId, current);
	}

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-6" data-testid="onboarding-survey-admin-page">
			<div>
				<h1 className="text-2xl font-semibold">新生問卷</h1>
				<p className="mt-1 text-sm text-muted-foreground">依課程查看學員填答統計與回應，最近保留 500 筆。</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2" data-testid="survey-course-summary">
				{courses.map((course) => {
					const courseResponses = responsesByCourse.get(course.id) ?? [];
					return (
						<Card key={course.id}>
							<CardHeader>
								<CardTitle className="flex items-center justify-between gap-3">
									<span>{course.title}</span>
									<span className="text-sm font-normal text-muted-foreground">{courseResponses.length} 份回應</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{courseResponses.length === 0 ? (
									<p className="text-sm text-muted-foreground">尚無填答。</p>
								) : (
									courseResponses.map((response) => (
										<article className="space-y-2 rounded-xl border p-3 text-sm" data-testid="survey-response" key={response.id}>
											<div className="flex flex-wrap justify-between gap-2">
												<span className="font-medium">{response.user.name} · {response.user.email}</span>
												<span className="text-muted-foreground">{formatDate(response.createdAt)}</span>
											</div>
											<p><strong>目標：</strong>{response.goals.join("、") || "未填"}</p>
											<p><strong>購買因素：</strong>{response.purchaseFactors.join("、") || "未填"}</p>
											{response.hesitation && <p><strong>猶豫：</strong>{response.hesitation}</p>}
											{response.alternatives && <p><strong>替代方案：</strong>{response.alternatives}</p>}
											{response.discoverySource && <p><strong>發現來源：</strong>{response.discoverySource}{response.discoverySourceOther ? `（${response.discoverySourceOther}）` : ""}</p>}
										</article>
									))
								)}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
