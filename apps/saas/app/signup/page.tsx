import Link from "next/link";

import { auth } from "@startkiter/auth";

import { LoginForm } from "../login/login-form";

export default function SignupPage() {
	return (
		<main>
			<section className="panel">
				<p className="muted">開站包</p>
				<h1>建立帳號</h1>
				<LoginForm googleEnabled={auth.enabledProviders.google} lineEnabled={auth.enabledProviders.line} mode="sign-up" />
				<p className="muted">
					已經有帳號？ <Link href="/login">登入</Link>
				</p>
			</section>
		</main>
	);
}
