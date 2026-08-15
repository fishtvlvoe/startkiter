import Link from "next/link";

import { messages } from "@startkiter/i18n";

export default function HomePage() {
	return (
		<main>
			<nav className="nav" aria-label="主要導覽">
				<strong>{messages.brand}</strong>
				<div className="nav-links">
					<Link href="/login">{messages.login}</Link>
					<Link href="/signup">{messages.signup}</Link>
				</div>
			</nav>
			<section className="hero">
				<p className="muted">StartKiter · zh-TW</p>
				<h1>{messages.homeTitle}</h1>
				<p>{messages.homeDescription}</p>
				<div className="actions">
					<Link className="button" href="/checkout">
						購買開站包 NT$8800
					</Link>
					<Link className="button secondary" href="/course">
						進入課程
					</Link>
					<Link className="button secondary" href="/signup">
						開始建立帳號
					</Link>
					<Link className="button secondary" href="/login">
						已有帳號，直接登入
					</Link>
				</div>
			</section>
		</main>
	);
}
