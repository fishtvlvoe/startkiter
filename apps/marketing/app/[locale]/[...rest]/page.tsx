import { getPublishedDatabasePage } from "@blog/lib/database-pages";
import { config as i18nConfig } from "@i18n/config";
import { getActivePathFromUrlParam } from "@shared/lib/content";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

type Params = {
	rest: string | string[];
	locale: string;
};

export async function generateMetadata(props: { params: Promise<Params> }) {
	const { rest, locale } = await props.params;
	const slug = getActivePathFromUrlParam(rest);
	const page = await getPublishedDatabasePage({
		slug,
		locale,
		type: "PAGE",
		fallbackLocale: i18nConfig.defaultLocale,
	});

	return {
		title: page?.seoTitle ?? page?.title,
		description: page?.seoDescription ?? page?.excerpt ?? undefined,
	};
}

export default async function DatabasePageRoute(props: { params: Promise<Params> }) {
	const { rest, locale } = await props.params;
	setRequestLocale(locale);

	const slug = getActivePathFromUrlParam(rest);
	const page = await getPublishedDatabasePage({
		slug,
		locale,
		type: "PAGE",
		fallbackLocale: i18nConfig.defaultLocale,
	});

	if (!page) {
		notFound();
	}

	return (
		<div className="container py-20 md:py-24 lg:py-28" data-testid="database-page">
			<h1 className="text-3xl font-medium tracking-tight md:text-4xl">{page.title}</h1>
			<div
				className="prose dark:prose-invert mt-8 max-w-2xl"
				dangerouslySetInnerHTML={{ __html: page.body }}
			/>
		</div>
	);
}
