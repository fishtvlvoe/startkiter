import Link from "next/link";

import { auth } from "@startkiter/auth";

import { LoginForm } from "./login-form";

export default function LoginPage() {
	return (
		<main>
			<section className="panel">
				<p className="muted">開站包</p>
				<h1>登入</h1>
				<LoginForm googleEnabled={auth.enabledProviders.google} lineEnabled={auth.enabledProviders.line} mode="sign-in" />
				<p className="muted">
					還沒有帳號？ <Link href="/signup">註冊</Link>
				</p>
			</section>
		</main>
	);
}
