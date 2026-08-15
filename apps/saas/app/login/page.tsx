import Link from "next/link";

import { auth } from "@startkiter/auth";

import { SiteNav } from "../components/site-nav";
import { LoginForm } from "./login-form";

type PageProps = {
	searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
	const { next } = await searchParams;
	return (
		<main>
			<SiteNav />
			<section className="panel">
				<h1>登入</h1>
				<p className="muted">用 email 與密碼進入開站包。</p>
				<LoginForm
					googleEnabled={auth.enabledProviders.google}
					lineEnabled={auth.enabledProviders.line}
					mode="sign-in"
					nextPath={next}
				/>
				<p className="muted">
					還沒有帳號？{" "}
					<Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>註冊</Link>
				</p>
			</section>
		</main>
	);
}
