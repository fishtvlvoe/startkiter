import { getSession } from "@auth/lib/server";
import { redirect } from "next/navigation";

import { InviteRedeemPanel } from "./invite-redeem-panel";

export default async function CourseInvitePage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;
	const session = await getSession();
	if (!session) {
		redirect(`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`);
	}

	return (
		<main className="min-h-screen px-6">
			<InviteRedeemPanel token={token} />
		</main>
	);
}
