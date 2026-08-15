import Link from "next/link";

import { messages } from "@startkiter/i18n";

import { SiteNav } from "./components/site-nav";

export default function HomePage() {
	return (
		<main>
			<SiteNav />
			<section className="hero" aria-label="開站包介紹">
				<p className="hero-brand">{messages.brand}</p>
				<h1>{messages.homeTitle}</h1>
				<p className="hero-lead">{messages.homeDescription}</p>
				<div className="actions">
					<Link className="button" href="/checkout">
						{messages.buyCta}
					</Link>
					<Link className="button secondary" href="/login">
						{messages.loginCta}
					</Link>
				</div>
			</section>
		</main>
	);
}
