import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";

import { AgentChatClient } from "./agent-chat-client";

export default async function AgentPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login");
	}

	return (
		<main>
			<nav className="nav" aria-label="主要導覽">
				<strong>
					<Link href="/">開站包</Link>
				</strong>
				<div className="nav-links">
					<Link href="/course">課程</Link>
					<span className="muted">{session.user.email}</span>
				</div>
			</nav>
			<AgentChatClient />
		</main>
	);
}
