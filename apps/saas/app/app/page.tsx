import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { getMessagesForLocale } from "@startkiter/i18n";

import { SiteNav } from "../components/site-nav";
import { userHasCourseAccess } from "../../lib/course-access";
import { getRequestLocale } from "../../lib/request-locale";
import { SignOutButton } from "./sign-out-button";

type AccountMessages = {
	account: {
		title: string;
		courseActive: string;
		courseInactive: string;
		enterCourse: string;
		buyCourse: string;
	};
};

export default async function AccountPage() {
	const session = await auth.api.getSession({ headers: new Headers(await headers()) });

	if (!session) {
		redirect("/login");
	}

	const entitled = await userHasCourseAccess(session.user.id);
	const locale = await getRequestLocale();
	const messages = await getMessagesForLocale<AccountMessages>(locale, "saas");

	return (
		<main>
			<SiteNav signedIn email={session.user.email} hasPurchase={entitled} locale={locale} />

			<section className="panel stack">
				<div>
					<h1>{messages.account.title}</h1>
					<p>
						{session.user.name}
					</p>
					<p className="muted">{session.user.email}</p>
					<p className="muted">{entitled ? messages.account.courseActive : messages.account.courseInactive}</p>
				</div>

				<div className="actions">
					<Link className="button" href="/course">
						{messages.account.enterCourse}
					</Link>
					{!entitled ? (
						<Link className="button secondary" href="/checkout">
							{messages.account.buyCourse}
						</Link>
					) : null}
					<SignOutButton />
				</div>
			</section>
		</main>
	);
}
