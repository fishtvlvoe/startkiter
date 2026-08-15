"use client";

export function SignOutButton() {
	async function onClick() {
		await fetch("/api/auth/sign-out", { method: "POST" });
		window.location.assign("/");
	}

	return (
		<button type="button" className="button secondary" onClick={onClick} style={{ padding: "6px 12px" }}>
			登出
		</button>
	);
}
