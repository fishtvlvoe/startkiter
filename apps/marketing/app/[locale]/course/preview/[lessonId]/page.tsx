import { CourseBuyCta } from "../../../../../modules/course/components/CourseBuyCta";
import { fetchPublishedCourse } from "../../../../../modules/course/lib/public-curriculum";
import { config } from "@config";
import { LocaleLink } from "@i18n/routing";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function CoursePreviewPage({
	params,
}: {
	params: Promise<{ locale: string; lessonId: string }>;
}) {
	const { locale, lessonId } = await params;

	setRequestLocale(locale);

	const course = await fetchPublishedCourse();
	const lesson = course?.chapters.flatMap((chapter) => chapter.lessons).find((item) => item.id === lessonId);

	if (!lesson || !lesson.isFreePreview) {
		notFound();
	}

	const saasUrl = config.saasUrl?.replace(/\/$/, "");
	const classroomHref = saasUrl ? `${saasUrl}/course/${lesson.id}` : "/contact";

	return (
		<div className="py-20 md:py-24 lg:py-28">
			<div className="container max-w-3xl space-y-6">
				<p className="text-sm font-medium text-primary">免費試看導流</p>
				<h1 className="text-3xl font-medium tracking-tight">{lesson.title}</h1>
				<p className="text-foreground/60 leading-relaxed">
					這個單元已開放試看。實際播放與講義在教室裡，登入後即可觀看。
				</p>
				<div className="flex flex-wrap gap-3">
					<a
						href={classroomHref}
						className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors"
					>
						前往教室試看
					</a>
					<CourseBuyCta label="直接購買 NT$8,800" />
					<LocaleLink href="/course" className="inline-flex h-11 items-center px-4 text-sm underline">
						看完整課綱
					</LocaleLink>
				</div>
			</div>
		</div>
	);
}
