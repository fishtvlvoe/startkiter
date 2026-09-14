import { getSession } from "@auth/lib/server";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { userCanAccessCourseId } from "@startkiter/api/modules/course/lib/course-access";
import { getBundleBySlug } from "@startkiter/bundles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@startkiter/ui";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CheckoutButton } from "../../checkout/checkout-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BundleDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const session = await getSession();

	if (!session) {
		redirect(`/login?next=/bundles/${slug}`);
	}

	const bundle = await getBundleBySlug(slug);

	if (!bundle) {
		notFound();
	}

	const accessResults = await Promise.all(
		bundle.courseIds.map((courseId) => userCanAccessCourseId(session.user.id, courseId)),
	);
	const ownsAllCourses = accessResults.length > 0 && accessResults.every(Boolean);

	return (
		<AuthWrapper contentClass="max-w-lg">
			<Card>
				<CardHeader>
					<CardTitle>{bundle.title}</CardTitle>
					<CardDescription>
						{bundle.description?.trim()
							? bundle.description
							: `組合包一次買斷 NT$${bundle.priceTwd.toLocaleString()}。`}
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-5">
					<div className="rounded-2xl border border-foreground/10 bg-muted/30 p-4 text-sm">
						<p className="mb-2 font-medium">包含課程</p>
						<ul className="list-disc space-y-1 pl-5 text-muted-foreground">
							{bundle.courseIds.map((courseId) => (
								<li key={courseId}>{courseId}</li>
							))}
						</ul>
						<p className="mt-3 text-base font-semibold tabular-nums">
							NT${bundle.priceTwd.toLocaleString()}
						</p>
					</div>

					{ownsAllCourses ? (
						<div className="space-y-3">
							<p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">已擁有</p>
							<p className="text-sm text-muted-foreground">
								你已擁有此組合包內的全部課程，可直接進入課程學習。
							</p>
							<Link
								className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors"
								href="/course"
							>
								進入課程
							</Link>
						</div>
					) : (
						<CheckoutButton
							product={{
								productId: bundle.id,
								title: bundle.title,
								amount: bundle.priceTwd,
							}}
						/>
					)}

					<p className="text-sm text-muted-foreground">
						想看其他組合？{" "}
						<Link className="text-primary underline underline-offset-4" href="/bundles">
							回組合包列表
						</Link>
					</p>
				</CardContent>
			</Card>
		</AuthWrapper>
	);
}
