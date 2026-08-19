"use client";

import { CourseMdxRenderer, FluentPlayerShell, type FluentVideoSource } from "@startkiter/course";
import { Card } from "@startkiter/ui";
import { useRef, useState } from "react";

export function AcademyPreview({
	content,
	title,
	videoSource,
}: {
	content: string | null;
	title: string;
	videoSource: FluentVideoSource;
}) {
	const [currentTime, setCurrentTime] = useState(0);
	const seek = useRef<(seconds: number) => void>(() => undefined);

	return (
		<div className="mx-auto max-w-5xl space-y-6">
			<FluentPlayerShell
				onSeekReady={(nextSeek) => {
					seek.current = nextSeek;
				}}
				onTimeUpdate={setCurrentTime}
				source={videoSource}
				title={title}
			/>
			<Card className="space-y-4 p-6">
				<div>
					<p className="text-sm text-muted-foreground">已發布試看</p>
					<h1 className="text-2xl font-semibold">{title}</h1>
				</div>
				<CourseMdxRenderer content={content} currentTime={currentTime} onSeek={(seconds) => seek.current(seconds)} />
			</Card>
		</div>
	);
}
