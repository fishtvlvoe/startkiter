import { getSignedUploadUrl } from "@startkiter/storage";
import { z } from "zod";

import { courseOperatorProcedure } from "../lib/course-operator";
import { mediaPathForUpload } from "./register-media";

export const mediaUploadUrl = courseOperatorProcedure
	.route({ method: "POST", path: "/course/media/upload-url", tags: ["Course media"], summary: "Create course media image upload URL" })
	.input(z.object({
		filename: z.string().trim().min(1).max(255),
		mimeType: z.string().trim().regex(/^image\/[a-z0-9.+-]+$/i).max(120),
		size: z.number().int().min(1).max(10_000_000),
	}))
	.handler(async ({ input, context }) => {
		const path = mediaPathForUpload(context.user.id, input.filename);
		const signedUploadUrl = await getSignedUploadUrl(path, {
			bucket: "media",
			contentType: input.mimeType,
			contentLength: input.size,
			ifNoneMatch: true,
		});
		return { signedUploadUrl, path };
	});
