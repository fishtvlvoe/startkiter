import { db } from "../prisma";
import { resolveVideoSource } from "../../api/modules/course/lib/video-resolver";

type FailedLesson = { lessonId: string; url: string; error: string };

async function main() {
	const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
	if (!adminEmail) throw new Error("ADMIN_EMAIL is required for media backfill ownership");

	const owner = await db.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
	if (!owner) throw new Error(`Cannot find ADMIN_EMAIL user: ${adminEmail}`);

	const lessons = await db.lesson.findMany({
		where: { videoUrl: { not: null } },
		select: { id: true, videoUrl: true },
		orderBy: { id: "asc" },
	});
	let created = 0;
	let skipped = 0;
	const failed: FailedLesson[] = [];

	for (const lesson of lessons) {
		const url = lesson.videoUrl?.trim();
		if (!url) {
			skipped += 1;
			continue;
		}
		const resolved = resolveVideoSource(url);
		if (!resolved.ok) {
			failed.push({ lessonId: lesson.id, url, error: resolved.error });
			continue;
		}

		const existing = await db.media.findFirst({
			where: { type: "VIDEO", url: resolved.url, usageType: "LESSON_CONTENT", usageId: lesson.id },
			select: { id: true },
		});
		if (existing) {
			skipped += 1;
			continue;
		}

		await db.media.create({
			data: {
				type: "VIDEO",
				provider: resolved.provider,
				sourceId: resolved.sourceId ?? null,
				url: resolved.url,
				uploadedBy: owner.id,
				usageType: "LESSON_CONTENT",
				usageId: lesson.id,
			},
		});
		created += 1;
	}

	console.log(`成功回填 ${created} 筆／已存在或空白略過 ${skipped} 筆／無法解析 ${failed.length} 筆`);
	for (const item of failed) console.log(`無法解析 lesson=${item.lessonId} url=${item.url} error=${item.error}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
}).finally(async () => {
	await db.$disconnect();
});
