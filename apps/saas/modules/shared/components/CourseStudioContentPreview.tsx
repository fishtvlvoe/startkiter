"use client";

import { useEffect, useState } from "react";
import { inspectMdxSource, LessonMdx, type MdxInspectResult } from "@startkiter/course";

export interface CourseStudioContentPreviewProps {
	source: string;
	className?: string;
}

interface PreviewState {
	source: string;
	inspection: MdxInspectResult;
}

export function CourseStudioContentPreview({
	source,
	className,
}: CourseStudioContentPreviewProps) {
	const [preview, setPreview] = useState<PreviewState | null>(null);

	useEffect(() => {
		setPreview(null);
		const timeout = window.setTimeout(() => {
			setPreview({
				source,
				inspection: inspectMdxSource(source),
			});
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [source]);

	return (
		<section
			aria-label="內容即時預覽"
			className={className}
			data-preview-status={preview === null ? "waiting" : preview.inspection.ok ? "valid" : "invalid"}
		>
			{preview === null ? (
				<p className="text-sm text-neutral-500">預覽更新中...</p>
			) : preview.inspection.ok ? (
				<LessonMdx source={preview.source} />
			) : (
				<p role="alert" className="text-sm text-red-600">
					{preview.inspection.error}
				</p>
			)}
		</section>
	);
}
