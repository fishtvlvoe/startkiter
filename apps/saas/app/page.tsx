import Link from "next/link";

import { getMessagesForLocale } from "@startkiter/i18n";

import { SiteNav } from "./components/site-nav";
import { getRequestLocale } from "../lib/request-locale";

type HomeMessages = {
	brand: string;
	home: {
		title: string;
		description: string;
		buyCta: string;
		loginCta: string;
	};
};

export default async function HomePage() {
	const locale = await getRequestLocale();
	const messages = await getMessagesForLocale<HomeMessages>(locale, "marketing");

	return (
		<main>
			<SiteNav locale={locale} />
			<section className="hero" aria-label={messages.brand}>
				<p className="hero-brand">{messages.brand}</p>
				<h1>{messages.home.title}</h1>
				<p className="hero-lead">{messages.home.description}</p>
				<div className="actions">
					<Link className="button" href="/checkout">
						{messages.home.buyCta}
					</Link>
					<Link className="button secondary" href="/login">
						{messages.home.loginCta}
					</Link>
				</div>
			</section>
		</main>
	);
}
