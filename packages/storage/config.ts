import type { StorageConfig } from "./types";

export const config = {
	bucketNames: {
		avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		assignments: process.env.NEXT_PUBLIC_ASSIGNMENTS_BUCKET_NAME ?? "assignments",
		lessonMessages: process.env.NEXT_PUBLIC_LESSON_MESSAGES_BUCKET_NAME ?? "lesson-messages",
		media: process.env.NEXT_PUBLIC_MEDIA_BUCKET_NAME ?? "media",
	},
} as const satisfies StorageConfig;
