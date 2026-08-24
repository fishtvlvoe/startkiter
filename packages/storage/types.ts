export interface StorageBucketNamesConfig {
	/**
	 * Bucket used for user and organization avatar uploads.
	 */
	avatars: string;
	/** Bucket used for course assignment attachments. */
	assignments: string;
	/** Bucket used for private lesson message attachments. */
	lessonMessages: string;
}

export interface StorageConfig {
	/**
	 * Logical storage bucket names used throughout the application.
	 */
	bucketNames: StorageBucketNamesConfig;
}

export type CreateBucketHandler = (
	name: string,
	options?: {
		public?: boolean;
	},
) => Promise<void>;

export type GetSignedUploadUrlHandler = (
	path: string,
	options: {
		bucket: keyof StorageBucketNamesConfig;
		contentType?: string;
		contentLength?: number;
		ifNoneMatch?: boolean;
	},
) => Promise<string>;

export type GetSignedUrlHander = (
	path: string,
	options: {
		bucket: keyof StorageBucketNamesConfig;
		expiresIn?: number;
		contentType?: string;
		contentDisposition?: string;
	},
) => Promise<string>;
