import { AcademyPreview } from "@academy/components/AcademyPreview";
import { getAcademyPreview } from "@academy/server";
import { Button, Card } from "@startkiter/ui";
import { ArrowLeftIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AcademyPreviewPage({
	params,
}: {
	params: Promise<{ lessonId: string; locale: string }>;
}) {
	const { lessonId, locale } = await params;
	setRequestLocale(locale);
	const lesson = await getAcademyPreview(lessonId);
	if (!lesson) {
		notFound();
	}

	return (
		<div className="container space-y-6 py-10">
			<Button render={(props) => <a {...props} href={`/${locale}/academy`} />} variant="ghost">
				<ArrowLeftIcon className="size-4" />
				回電馭學院
			</Button>
			<Card className="border-primary/30 bg-primary/5 p-4 text-sm">
				這是已發布的試看內容；完整課程仍依 PAYUNi 訂單的 courseAccess 權限開放。
			</Card>
			<AcademyPreview content={lesson.content} title={lesson.title} videoSource={lesson.videoSource} />
		</div>
	);
}
