import Link from "next/link";

import { messages } from "@startkiter/i18n";

type SiteNavProps = {
	signedIn?: boolean;
	email?: string | null;
};

export function SiteNav({ signedIn = false, email }: SiteNavProps) {
	return (
		<nav className="nav" aria-label="主要導覽">
			<Link className="nav-brand" href="/">
				{messages.brand}
			</Link>
			<div className="nav-links">
				{signedIn ? (
					<>
						<Link href="/course">課程</Link>
						<Link href="/checkout">購買</Link>
						<Link href="/agent">助手</Link>
						<Link href="/app">帳號</Link>
						{email ? <span className="nav-email">{email}</span> : null}
					</>
				) : (
					<>
						<Link href="/login">{messages.login}</Link>
						<Link href="/signup">{messages.signup}</Link>
					</>
				)}
			</div>
		</nav>
	);
}
