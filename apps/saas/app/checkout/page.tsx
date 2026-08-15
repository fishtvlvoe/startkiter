import { auth } from "@startkiter/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteNav } from "../components/site-nav";
import { userHasCourseAccess } from "../../lib/course-access";
import { CheckoutButton } from "./checkout-button";

export default async function CheckoutPage() {
	const session = await auth.api.getSession({ headers: new Headers(await headers()) });
	if (!session) {
		redirect("/login?next=/checkout");
	}

	const entitled = await userHasCourseAccess(session.user.id);

	return (
		<main>
			<SiteNav signedIn email={session.user.email} hasPurchase={entitled} />
			<section className="panel stack">
				<div>
					<h1>{entitled ? "購買狀態" : "購買開站包"}</h1>
					{entitled ? (
						<p>你已擁有開站包。可直接進入課程與領取代碼包。</p>
					) : (
						<p>課 + 終身代碼包，一次買斷 NT$8,800。付款走 PAYUNi。</p>
					)}
				</div>
				{entitled ? (
					<div className="actions">
						<Link className="button" href="/course">
							進入課程
						</Link>
					</div>
				) : (
					<>
						<div className="callout">
							<p style={{ margin: 0 }}>付完款即可看課。代碼包要再到課程頁綁定 GitHub 後領取。</p>
						</div>
						<CheckoutButton />
					</>
				)}
				<p className="muted">
					想先逛逛？ <Link href="/course">回課程</Link>
				</p>
			</section>
		</main>
	);
}
