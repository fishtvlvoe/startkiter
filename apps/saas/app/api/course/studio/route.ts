import { auth } from "@startkiter/auth";
import { db, VideoProvider } from "@startkiter/database";
import { NextResponse } from "next/server";
import { resolveVideoSource } from "@startkiter/api/modules/course/lib/video-resolver";

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}

	const courses = await db.course.findMany({
		include: {
			chapters: {
				orderBy: { order: "asc" },
				include: {
					lessons: {
						orderBy: { order: "asc" },
					},
				},
			},
		},
	});

	const folders = await db.studioFolder.findMany({
		orderBy: { order: "asc" },
	});

	return NextResponse.json({ courses, folders });
}

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { action, payload } = body;

		if (action === "update_lesson") {
			const { id, title, videoUrl, videoDuration, isFreePreview, content, aiContext } = payload;
			let videoProvider: VideoProvider | undefined = undefined;

			if (videoUrl) {
				const resolved = resolveVideoSource(videoUrl);
				if (resolved.ok) {
					videoProvider = resolved.provider as VideoProvider;
				}
			}

			const updated = await db.lesson.update({
				where: { id },
				data: {
					title,
					videoUrl,
					videoDuration,
					isFreePreview,
					content,
					aiContext,
					...(videoProvider ? { videoProvider } : {}),
				},
			});

			return NextResponse.json({ success: true, lesson: updated });
		}

		if (action === "update_folder") {
			const { id, name, isCollapsed } = payload;
			const updated = await db.studioFolder.update({
				where: { id },
				data: { name, isCollapsed },
			});
			return NextResponse.json({ success: true, folder: updated });
		}

		return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
	} catch (error) {
		return NextResponse.json({ error: "INTERNAL_ERROR", details: String(error) }, { status: 500 });
	}
}
