import type { StorageConfig } from "./types";

export const config = {
	bucketNames: {
		avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		assignments: process.env.NEXT_PUBLIC_ASSIGNMENTS_BUCKET_NAME ?? "assignments",
	},
} as const satisfies StorageConfig;
