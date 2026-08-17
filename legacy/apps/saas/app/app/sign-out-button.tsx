"use client";

import { Button } from "@startkiter/ui";

export function SignOutButton() {
	async function onClick() {
		await fetch("/api/auth/sign-out", { method: "POST" });
		window.location.assign("/");
	}

	return (
		<Button type="button" variant="outline" className="ds-btn" data-variant="outline" data-size="md" onClick={onClick}>
			登出
		</Button>
	);
}
