import { SectionHeader } from "@home/components/SectionHeader";
import { getAllLegalPages } from "@legal/lib/pages";
import { LocaleLink } from "@i18n/routing";
import { ArrowRightIcon } from "lucide-react";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata() {
	return {
		title: "Legal",
	};
}

export default async function LegalIndexPage(props: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await props.params;
	setRequestLocale(locale);

	const pages = await getAllLegalPages(locale);

	return (
		<div className="py-20 md:py-24 lg:py-28 lg:pb-40">
			<div className="container">
				<SectionHeader
					titleAs="h1"
					eyebrow="Legal"
					title="Legal information"
					description="Review our privacy policy and terms and conditions."
				/>

				<div className="max-w-3xl divide-y divide-border/60 border-y border-border/60">
					{pages.map((page) => (
						<LocaleLink
							key={page.path}
							href={`/legal/${page.path}`}
							className="group gap-4 py-5 flex items-center justify-between text-lg transition-colors hover:text-touch"
						>
							<span>{page.title}</span>
							<ArrowRightIcon className="size-5 transition-transform group-hover:translate-x-1" />
						</LocaleLink>
					))}
				</div>
			</div>
		</div>
	);
}
