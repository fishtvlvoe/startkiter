import { auth } from "@startkiter/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteNav } from "../components/site-nav";
import { CheckoutButton } from "./checkout-button";

export default async function CheckoutPage() {
	const session = await auth.api.getSession({ headers: new Headers(await headers()) });
	if (!session) {
		redirect("/login");
	}

	return (
		<main>
			<SiteNav signedIn email={session.user.email} />
			<section className="panel stack">
				<div>
					<h1>購買開站包</h1>
					<p>課 + 終身代碼包，一次買斷 NT$8,800。付款走 PAYUNi。</p>
				</div>
				<div className="callout">
					<p style={{ margin: 0 }}>付完款即可看課。代碼包要再到課程頁綁定 GitHub 後領取。</p>
				</div>
				<CheckoutButton />
				<p className="muted">
					想先逛逛？ <Link href="/course">回課程</Link>
				</p>
			</section>
		</main>
	);
}
