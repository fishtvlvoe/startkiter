import { cn } from "@startkiter/ui";
import { CheckCircle2Icon, CreditCardIcon, ReceiptIcon, WalletIcon } from "lucide-react";

export function FeaturePreview({ variant }: { variant: "learning" | "delivery" }) {
	return (
		<div className="shadow-olive-950/25 dark:shadow-black/65 w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_16px_48px_-28px]">
			<div className="gap-1.5 px-3 py-2.5 flex items-center border-b border-border/60">
				<span className="size-2 rounded-full bg-foreground/15" />
				<span className="size-2 rounded-full bg-foreground/10" />
				<span className="size-2 rounded-full bg-foreground/10" />
			</div>

			{variant === "learning" ? <LearningPreview /> : <DeliveryPreview />}
		</div>
	);
}

function PreviewRow({
	meta,
	emphasized = false,
}: {
	meta: string;
	emphasized?: boolean;
}) {
	return (
		<div
			className={cn("gap-3 px-3 py-2.5 flex items-center rounded-lg", emphasized && "bg-touch/6")}
		>
			<span className="size-7 flex shrink-0 items-center justify-center rounded-full border border-touch/20 bg-touch/8 text-touch">
				<CheckCircle2Icon className="size-3.5" />
			</span>
			<div className="min-w-0 flex-1">
				<div className="h-2 w-24 rounded-full bg-foreground/20" />
				<div className="mt-1.5 h-1.5 w-16 rounded-full bg-foreground/10" />
			</div>
			<span className="font-medium tracking-wide text-xs text-foreground/40">{meta}</span>
		</div>
	);
}

function LearningPreview() {
	return (
		<div className="gap-6 p-4 sm:grid-cols-[7.5rem_1fr] grid grid-cols-1">
			<div className="gap-2 sm:flex hidden flex-col">
				<div className="h-2 w-16 rounded-full bg-foreground/15" />
				<div className="h-2 w-12 rounded-full bg-foreground/8" />
				<div className="h-2 w-14 rounded-full bg-foreground/8" />
				<div className="mt-3 h-2 w-10 rounded-full bg-foreground/8" />
			</div>
			<div className="gap-1 flex flex-col">
				<PreviewRow meta="Lesson" emphasized />
				<PreviewRow meta="Practice" />
				<PreviewRow meta="Checkpoint" />
			</div>
		</div>
	);
}

function DeliveryPreview() {
	return (
		<div className="gap-1 p-4 flex flex-col">
			<div className="gap-3 px-3 py-3 flex items-center justify-between rounded-lg">
				<div className="gap-3 flex items-center">
					<span className="size-7 inline-flex items-center justify-center rounded-md border border-border/70 bg-muted/50 text-foreground/45">
						<WalletIcon className="size-3.5" />
					</span>
					<div>
						<div className="h-2 w-14 rounded-full bg-foreground/20" />
						<div className="mt-2 h-1.5 w-24 rounded-full bg-foreground/10" />
					</div>
				</div>
				<div className="h-2 w-10 rounded-full bg-foreground/15" />
			</div>
			<div className="gap-3 px-3 py-3 flex items-center justify-between rounded-lg bg-touch/6 ring-1 ring-touch/15">
				<div className="gap-3 flex items-center">
					<span className="size-7 inline-flex items-center justify-center rounded-md border border-touch/20 bg-touch/8 text-touch">
						<CreditCardIcon className="size-3.5" />
					</span>
					<div>
						<div className="h-2 w-12 rounded-full bg-foreground/25" />
						<div className="mt-2 h-1.5 w-28 rounded-full bg-foreground/10" />
					</div>
				</div>
				<div className="h-2 w-12 rounded-full bg-foreground/20" />
			</div>
			<div className="gap-3 px-3 py-3 flex items-center justify-between rounded-lg">
				<div className="gap-3 flex items-center">
					<span className="size-7 inline-flex items-center justify-center rounded-md border border-border/70 bg-muted/50 text-foreground/45">
						<ReceiptIcon className="size-3.5" />
					</span>
					<div>
						<div className="h-2 w-20 rounded-full bg-foreground/20" />
						<div className="mt-2 h-1.5 w-20 rounded-full bg-foreground/10" />
					</div>
				</div>
				<div className="h-2 w-16 rounded-full bg-foreground/15" />
			</div>
		</div>
	);
}
