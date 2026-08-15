import Link from "next/link";

import { auth } from "@startkiter/auth";

import { SiteNav } from "../components/site-nav";
import { LoginForm } from "../login/login-form";

export default function SignupPage() {
	return (
		<main>
			<SiteNav />
			<section className="panel">
				<h1>建立帳號</h1>
				<p className="muted">註冊後可購買開站包，一次帶走課程與終身代碼包。</p>
				<LoginForm
					googleEnabled={auth.enabledProviders.google}
					lineEnabled={auth.enabledProviders.line}
					mode="sign-up"
				/>
				<p className="muted">
					已經有帳號？ <Link href="/login">登入</Link>
				</p>
			</section>
		</main>
	);
}
