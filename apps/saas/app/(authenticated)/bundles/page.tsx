import { getSession } from "@auth/lib/server";
import { AuthWrapper } from "@shared/components/AuthWrapper";
import { listPublishedBundles } from "@startkiter/bundles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@startkiter/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BundlesBrowsePage() {
	const session = await getSession();

	if (!session) {
		redirect("/login?next=/bundles");
	}

	const bundles = await listPublishedBundles();

	return (
		<AuthWrapper contentClass="max-w-lg">
			<Card>
				<CardHeader>
					<CardTitle>組合包</CardTitle>
					<CardDescription>瀏覽已上架的課程組合，點進去看詳情與購買。</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					{bundles.length === 0 ? (
						<p className="text-sm text-muted-foreground">目前沒有已上架的組合包。</p>
					) : (
						<ul className="space-y-3">
							{bundles.map((bundle) => (
								<li key={bundle.id}>
									<Link
										href={`/bundles/${bundle.slug}`}
										className="block rounded-2xl border border-foreground/10 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
									>
										<p className="font-semibold">{bundle.title}</p>
										{bundle.description?.trim() ? (
											<p className="mt-1 text-sm text-muted-foreground">{bundle.description}</p>
										) : null}
										<p className="mt-2 text-sm font-medium tabular-nums">
											NT${bundle.priceTwd.toLocaleString()}
										</p>
									</Link>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</AuthWrapper>
	);
}
