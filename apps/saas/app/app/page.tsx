import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { messages } from "@startkiter/i18n";

import { SiteNav } from "../components/site-nav";
import { userHasCourseAccess } from "../../lib/course-access";
import { SignOutButton } from "./sign-out-button";

export default async function AccountPage() {
	const session = await auth.api.getSession({ headers: new Headers(await headers()) });

	if (!session) {
		redirect("/login");
	}

	const entitled = await userHasCourseAccess(session.user.id);

	return (
		<main>
			<SiteNav signedIn email={session.user.email} />

			<section className="panel stack">
				<div>
					<h1>{messages.account}</h1>
					<p>
						{session.user.name}
					</p>
					<p className="muted">{session.user.email}</p>
					<p className="muted">課程：{entitled ? "已開通" : "尚未購買"}</p>
				</div>

				<div className="actions">
					<Link className="button" href="/course">
						進入課程
					</Link>
					{!entitled ? (
						<Link className="button secondary" href="/checkout">
							購買開站包 NT$8,800
						</Link>
					) : null}
					<SignOutButton />
				</div>
			</section>
		</main>
	);
}
