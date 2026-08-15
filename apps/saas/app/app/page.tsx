import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";
import { messages } from "@startkiter/i18n";

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
			<nav className="nav" aria-label="主要導覽">
				<strong>
					<Link href="/">{messages.brand}</Link>
				</strong>
				<div className="nav-links">
					<Link href="/course">課程</Link>
					<Link href="/checkout">結帳</Link>
					<SignOutButton />
				</div>
			</nav>

			<section className="panel">
				<p className="muted">{messages.brand}</p>
				<h1>帳號設定</h1>
				<p>
					{session.user.name}，你已登入。
				</p>
				<p className="muted">{session.user.email}</p>
				<p className="muted">
					課程權限：{entitled ? "已開通（courseAccess=true）" : "尚未開通"}
				</p>

				<div className="actions">
					<Link className="button" href="/course">
						進入課程
					</Link>
					<Link className="button secondary" href="/checkout">
						購買開站包 NT$8800
					</Link>
					<Link className="button secondary" href="/">
						回首頁
					</Link>
				</div>

				<p className="muted" style={{ marginTop: 24 }}>
					MVP 沒有獨立「後台」管理台。學員入口就是課程／結帳；金流金鑰目前走 .env。
				</p>
			</section>
		</main>
	);
}
