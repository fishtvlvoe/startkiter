const TOOL_SANDBOX = "allow-scripts allow-forms allow-popups allow-downloads";

export function LessonToolEmbed({
	title,
	toolUrl,
	newTabHref,
}: {
	title: string;
	toolUrl: string | null | undefined;
	newTabHref: string | null | undefined;
}) {
	if (!toolUrl) {
		return null;
	}

	const heading = title.trim() || "課程工具";

	return (
		<section className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-base font-bold text-neutral-100">{heading}</h2>
				{newTabHref ? (
					<a
						href={newTabHref}
						target="_blank"
						rel="noreferrer"
						className="text-xs font-medium text-primary hover:underline"
					>
						在新分頁開啟
					</a>
				) : null}
			</div>
			<iframe
				src={toolUrl}
				title={heading}
				className="aspect-video w-full rounded-md border-0 bg-white"
				sandbox={TOOL_SANDBOX}
			/>
		</section>
	);
}
