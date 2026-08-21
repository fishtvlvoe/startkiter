import { getBundleBySlug } from "@startkiter/bundles";
import { Button, Card, CardContent } from "@startkiter/ui";
import { notFound } from "next/navigation";

function PackageIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="4" y="12" width="7" height="7" />
			<rect x="13" y="12" width="7" height="7" />
			<rect x="8.5" y="4" width="7" height="7" />
		</svg>
	);
}

export default async function BundleSalesPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const bundle = await getBundleBySlug(slug);

	// design.md Requirement「Draft bundle is not publicly visible」：
	// draft／archived／不存在一律 404，不洩漏 bundle 是否存在。
	if (!bundle) {
		notFound();
	}

	return (
		<div className="flex min-h-screen flex-col">
			<header className="bg-card border-border sticky top-0 z-40 flex h-16 items-center justify-between border-b px-6">
				<a href="/" className="flex items-center gap-2 text-base font-semibold">
					<span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-sm font-bold">
						S
					</span>
					<span>StartKiter 學院</span>
				</a>
				<span className="text-muted-foreground hidden font-mono text-xs sm:inline">/bundles/{bundle.slug}</span>
			</header>

			<section className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 pb-8 pt-12 text-center">
				<div className="bg-secondary text-secondary-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
					<PackageIcon className="size-2.5" />
					<span>組合包限定優惠・{bundle.courseIds.length} 堂課一起買更划算</span>
				</div>
				<h1 className="text-3xl font-bold tracking-tight text-balance md:text-5xl">{bundle.title}</h1>
				{bundle.description && (
					<p className="text-muted-foreground max-w-xl text-base leading-relaxed">{bundle.description}</p>
				)}
			</section>

			<section className="mx-auto w-full max-w-3xl px-6 py-8">
				<h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
					<span>這個組合包包含 {bundle.courseIds.length} 堂課</span>
				</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{bundle.courseIds.map((courseId) => (
						<Card key={courseId} className="p-5">
							<div className="bg-secondary flex aspect-video items-center justify-center rounded-2xl">
								<PackageIcon className="text-secondary-foreground size-7 opacity-60" />
							</div>
							<p className="text-muted-foreground mt-3 font-mono text-xs">{courseId}</p>
						</Card>
					))}
				</div>
			</section>

			<section className="mx-auto w-full max-w-md px-6 py-10">
				<Card className="p-8">
					<CardContent className="flex flex-col items-center gap-6 p-0 text-center">
						<div className="space-y-2">
							<span className="bg-secondary text-secondary-foreground inline-block rounded-full px-3 py-1 text-xs font-semibold">
								組合包價格
							</span>
							<div className="text-4xl font-bold tabular-nums">NT$ {bundle.priceTwd.toLocaleString()}</div>
						</div>

						{/* Phase 3（Coupon 驗證）與 Phase 4（結帳支援 productId）尚未實作，
						    在那之前不放行真的購買動作，避免買家以為買到 bundle 卻被結帳成 MVP 單一課程。 */}
						<Button className="w-full" size="lg" disabled>
							結帳功能準備中
						</Button>
						<p className="text-muted-foreground text-xs">組合包結帳與優惠券即將上線，敬請期待。</p>
					</CardContent>
				</Card>
			</section>

			<footer className="bg-card border-border text-muted-foreground mt-auto border-t px-6 py-6 text-center text-xs">
				© 2026 StartKiter. 繁體中文 SSOT 開發標準.
			</footer>
		</div>
	);
}
