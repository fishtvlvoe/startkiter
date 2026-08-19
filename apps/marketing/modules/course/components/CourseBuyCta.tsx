import { config } from "@config";

export function CourseBuyCta({ label }: { label: string }) {
	const saasUrl = config.saasUrl?.replace(/\/$/, "");
	const href = saasUrl ? `${saasUrl}/checkout` : "/contact";

	return (
		<a
			href={href}
			className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors"
		>
			{label}
		</a>
	);
}
