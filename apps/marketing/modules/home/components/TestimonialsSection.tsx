"use client";

import { SectionHeader } from "@home/components/SectionHeader";
import { Logo } from "@startkiter/ui";
import { useTranslations } from "next-intl";

const TESTIMONIAL_KEYS = ["item1", "item2", "item3"] as const;

export function TestimonialsSection() {
	const t = useTranslations();

	return (
		<section id="testimonials" className="scroll-mt-20 py-24 lg:py-32 border-t border-border/60">
			<div className="container">
				<SectionHeader
					eyebrow={t("home.testimonials.badge")}
					title={t("home.testimonials.title")}
					description={t("home.testimonials.description")}
				/>

				<div className="gap-12 md:grid-cols-3 md:gap-16 grid grid-cols-1">
					{TESTIMONIAL_KEYS.map((itemKey) => (
						<div key={itemKey} className="gap-8 flex flex-col justify-between">
							<p className="text-base leading-relaxed text-foreground/70">
								{t(`home.testimonials.items.${itemKey}.quote`)}
							</p>
							<div className="gap-3 flex items-center">
								<div className="size-10 flex shrink-0 items-center justify-center rounded-full border border-touch/20 bg-touch/8 text-touch">
									<Logo withLabel={false} className="[&>svg]:size-5" />
								</div>
								<div>
									<p className="font-medium text-sm tracking-tight text-foreground">
										{t(`home.testimonials.items.${itemKey}.name`)}
									</p>
									<p className="mt-0.5 text-sm text-foreground/45">
										{t(`home.testimonials.items.${itemKey}.role`)}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
