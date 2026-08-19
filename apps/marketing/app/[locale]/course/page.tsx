import { CourseBuyCta } from "../../../modules/course/components/CourseBuyCta";
import { formatTotalDuration, parseDurationToSeconds } from "../../../modules/course/lib/duration";
import { fetchPublishedCourse } from "../../../modules/course/lib/public-curriculum";
import { LocaleLink } from "@i18n/routing";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function CourseSalesPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	setRequestLocale(locale);

	const course = await fetchPublishedCourse();
	const chapters = course?.chapters ?? [];
	const lessons = chapters.flatMap((chapter) => chapter.lessons);
	const previewLessons = lessons.filter((lesson) => lesson.isFreePreview);
	const totalSeconds = lessons.reduce(
		(sum, lesson) => sum + parseDurationToSeconds(lesson.videoDuration),
		0,
	);

	return (
		<div className="py-20 md:py-24 lg:py-28">
			<div className="container max-w-4xl space-y-10">
				<div className="space-y-4">
					<p className="text-sm font-medium text-primary">開站包課程</p>
					<h1 className="text-4xl font-medium tracking-tight">{course?.title ?? "課程即將上架"}</h1>
					<p className="text-foreground/60 leading-relaxed">
						{course?.description ?? "目前還沒有已發布的課程資料。"}
					</p>
					<p className="text-sm text-foreground/55">
						{chapters.length} 個模組 · {lessons.length} 個單元 · {formatTotalDuration(totalSeconds)}
					</p>
					<CourseBuyCta label="購買開站包 NT$8,800" />
				</div>

				<section className="space-y-4">
					<h2 className="text-2xl font-medium tracking-tight">課綱</h2>
					{chapters.length === 0 ? (
						<p className="text-foreground/55">尚無已發布課綱。</p>
					) : (
						<div className="space-y-6">
							{chapters.map((chapter) => (
								<div key={chapter.id} className="rounded-xl border border-border/60 p-5">
									<h3 className="font-medium">{chapter.title}</h3>
									<ul className="mt-3 space-y-2">
										{chapter.lessons.map((lesson) => (
											<li
												key={lesson.id}
												className="flex items-center justify-between text-sm text-foreground/70"
											>
												<span>{lesson.title}</span>
												<span className="font-mono text-xs text-foreground/45">
													{lesson.videoDuration ?? ""}
													{lesson.isFreePreview ? " · 試看" : ""}
												</span>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					)}
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-medium tracking-tight">免費試看</h2>
					{previewLessons.length === 0 ? (
						<p className="text-foreground/55">目前沒有開放試看的單元。</p>
					) : (
						<ul className="space-y-3">
							{previewLessons.map((lesson) => (
								<li key={lesson.id}>
									<LocaleLink
										href={`/course/preview/${lesson.id}`}
										className="text-primary underline"
									>
										試看：{lesson.title}
									</LocaleLink>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</div>
	);
}
