import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@startkiter/auth";

import { SiteNav } from "../components/site-nav";
import { AgentChatClient } from "./agent-chat-client";

export default async function AgentPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/login");
	}

	return (
		<main>
			<SiteNav signedIn email={session.user.email} />
			<AgentChatClient />
		</main>
	);
}
