import { config } from "@config";
import { getAcademyCatalog } from "@academy/server";
import { MVP_AMOUNT_TWD } from "@startkiter/payments/constants";
import { parseTimecode } from "@startkiter/course/timecode";
import { Button, Card } from "@startkiter/ui";
import { CheckCircle2Icon, LockKeyholeIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

function totalDurationLabel(values: Array<string | null>) {
	const seconds = values.reduce((total, value) => {
		if (!value) {
			return total;
		}
		try {
			return total + parseTimecode(value);
		} catch {
			return total;
		}
	}, 0);
	if (!seconds) {
		return "時長將在影音驗證後顯示";
	}
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.round((seconds % 3600) / 60);
	return hours > 0 ? `${hours} 小時 ${minutes} 分鐘` : `${minutes} 分鐘`;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AcademySalesPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	setRequestLocale(locale);
	const catalog = await getAcademyCatalog();
	const lessons = catalog?.chapters.flatMap((chapter) => chapter.lessons) ?? [];
	const previewLesson = lessons.find((lesson) => lesson.isFreePreview);
	const checkoutUrl = config.saasUrl ? new URL("/checkout", config.saasUrl).toString() : null;

	if (!catalog?.course) {
		return (
			<section className="container py-20">
				<Card className="mx-auto max-w-2xl space-y-3 p-8">
					<h1 className="text-3xl font-semibold">電馭學院</h1>
					<p className="text-muted-foreground">公開課程資料尚未設定或暫時無法取得，沒有顯示任何預設課綱。</p>
				</Card>
			</section>
		);
	}

	return (
		<div className="container space-y-20 py-12 md:py-20">
			<section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
				<div className="space-y-6">
					<p className="text-sm font-semibold text-primary">StartKiter Academy</p>
					<h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">{catalog.course.title}</h1>
					<p className="max-w-2xl text-lg text-muted-foreground">
						{catalog.course.description ?? "用真實產品流程，完成可維護的開站包。"}
					</p>
					<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
						<span>{lessons.length} 個已發布單元</span>
						<span>{totalDurationLabel(lessons.map((lesson) => lesson.videoDuration))}</span>
					</div>
					<div className="flex flex-wrap gap-3">
						{checkoutUrl ? (
							<Button render={(props) => <a {...props} href={checkoutUrl} />} size="lg">
								購買開站包 · TWD {MVP_AMOUNT_TWD.toLocaleString("zh-TW")}
							</Button>
						) : <Button disabled size="lg">結帳站尚未設定</Button>}
						{previewLesson ? (
							<Button render={(props) => <a {...props} href={`/${locale}/academy/preview/${previewLesson.id}`} />} size="lg" variant="outline">
								<PlayIcon className="mr-2 size-4" />
								先看已發布試看
							</Button>
						) : null}
					</div>
				</div>
				<Card className="space-y-4 p-6">
					<h2 className="text-lg font-semibold">這門課會帶你完成</h2>
					{["建立可賣的開站包流程", "理解登入、結帳與權限閘門", "把產品做成可持續維護的程式碼"].map((item) => (
						<p className="flex items-start gap-2 text-sm" key={item}>
							<CheckCircle2Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
							{item}
						</p>
					))}
				</Card>
			</section>

			<section className="space-y-6" id="curriculum">
				<div>
					<p className="text-sm font-semibold text-primary">課綱</p>
					<h2 className="text-3xl font-semibold">已發布內容</h2>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					{catalog.chapters.map((chapter) => (
						<Card className="p-5" key={chapter.id}>
							<h3 className="font-semibold">{chapter.title}</h3>
							<ol className="mt-3 space-y-2 text-sm text-muted-foreground">
								{chapter.lessons.map((lesson, index) => (
									<li className="flex items-center gap-2" key={lesson.id}>
										<span className="w-6 text-right tabular-nums">{index + 1}.</span>
										<span className="min-w-0 flex-1 truncate">{lesson.title}</span>
										{lesson.isFreePreview ? (
											<Link className="text-primary underline underline-offset-4" href={`/${locale}/academy/preview/${lesson.id}`}>試看</Link>
										) : <LockKeyholeIcon aria-label="完整內容" className="size-4" />}
									</li>
								))}
							</ol>
						</Card>
					))}
				</div>
			</section>

			<section className="grid gap-5 md:grid-cols-2">
				<Card className="space-y-3 p-6">
					<h2 className="text-xl font-semibold">講師方式</h2>
					<p className="text-sm text-muted-foreground">每個單元都從可驗證的產品決策出發，搭配影片、講義與即時互動，而不是交付無法重現的範例。</p>
				</Card>
				<Card className="space-y-3 p-6">
					<h2 className="text-xl font-semibold">常見問題</h2>
					<p className="text-sm text-muted-foreground">一次買斷包含課程與終身代碼包；付款、退款與存取資格都由既有 PAYUNi 訂單流程處理。</p>
				</Card>
			</section>
		</div>
	);
}
