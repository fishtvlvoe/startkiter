import Link from "next/link";

import { auth } from "@startkiter/auth";

import { SiteNav } from "../components/site-nav";
import { LoginForm } from "./login-form";

export default function LoginPage() {
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
				/>
				<p className="muted">
					還沒有帳號？ <Link href="/signup">註冊</Link>
				</p>
			</section>
		</main>
	);
}
