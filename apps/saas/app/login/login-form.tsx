"use client";

import { useState } from "react";

type AuthMode = "sign-in" | "sign-up";

export function LoginForm({ mode, googleEnabled, lineEnabled }: { mode: AuthMode; googleEnabled: boolean; lineEnabled: boolean }) {
	const [error, setError] = useState<string | null>(null);
	const isSignUp = mode === "sign-up";

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		const values = new FormData(event.currentTarget);
		const response = await fetch(`/api/auth/${isSignUp ? "sign-up" : "sign-in"}/email`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(Object.fromEntries(values.entries())),
		});

		if (!response.ok) {
			setError("登入資料不正確，或服務尚未完成設定。");
			return;
		}

		window.location.assign("/course");
	}

	async function socialSignIn(provider: "google" | "line") {
		setError(null);
		const response = await fetch("/api/auth/sign-in/social", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ provider, callbackURL: "/course" }),
		});
		const result = (await response.json()) as { url?: string };

		if (!response.ok || !result.url) {
			setError("這個登入方式目前無法使用。");
			return;
		}

		window.location.assign(result.url);
	}

	return (
		<>
			<form className="form" onSubmit={submit}>
				{isSignUp ? (
					<label>
						名稱
						<input name="name" autoComplete="name" required />
					</label>
				) : null}
				<label>
					Email
					<input name="email" type="email" autoComplete="email" required />
				</label>
				<label>
					密碼
					<input name="password" type="password" minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} required />
				</label>
				<button className="button" type="submit">
					{isSignUp ? "建立帳號" : "登入"}
				</button>
			</form>
			{error ? <p className="error" role="alert">{error}</p> : null}
			{!isSignUp && (googleEnabled || lineEnabled) ? (
				<div className="provider-actions" aria-label="社群登入">
					{googleEnabled ? (
						<button className="button secondary" type="button" onClick={() => socialSignIn("google")}>
							使用 Google 登入
						</button>
					) : null}
					{lineEnabled ? (
						<button className="button secondary" type="button" onClick={() => socialSignIn("line")}>
							使用 LINE 登入
						</button>
					) : null}
				</div>
			) : null}
		</>
	);
}
