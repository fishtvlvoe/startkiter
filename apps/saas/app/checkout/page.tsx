import { auth } from "@startkiter/auth";
import { messages } from "@startkiter/i18n";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutButton } from "./checkout-button";

export default async function CheckoutPage() {
	const session = await auth.api.getSession({ headers: new Headers(await headers()) });
	if (!session) {
		redirect("/login");
	}

	return (
		<main>
			<nav className="nav" aria-label="主要導覽">
				<strong>{messages.brand}</strong>
				<div className="nav-links">
					<Link href="/app">帳號</Link>
				</div>
			</nav>
			<section className="panel">
				<p className="muted">單一 SKU · startkiter-mvp</p>
				<h1>結帳</h1>
				<p>課 + 終身代碼包，一次買斷 NT$8,800（TWD）。主金流 PAYUNi。</p>
				<CheckoutButton />
			</section>
		</main>
	);
}
