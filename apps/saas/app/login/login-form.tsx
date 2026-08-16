"use client";

import { useState } from "react";
import { Button, Form, Input } from "@startkiter/ui";

type AuthMode = "sign-in" | "sign-up";

type SocialProviderId = "google" | "line";

export const AUTH_SOCIAL_PROVIDERS: { id: SocialProviderId; label: string }[] = [
	{ id: "google", label: "使用 Google 登入" },
	{ id: "line", label: "使用 LINE 登入" },
];

function safeNextPath(next: string | undefined) {
	if (!next) {
		return "/course";
	}

	let trimmed = next.trim();
	try {
		trimmed = decodeURIComponent(trimmed);
	} catch {
		return "/course";
	}

	if (
		!trimmed.startsWith("/") ||
		trimmed.startsWith("//") ||
		trimmed.includes("\\") ||
		trimmed.includes("://") ||
		trimmed.includes("..") ||
		/[\u0000-\u001f]/.test(trimmed)
	) {
		return "/course";
	}

	try {
		const url = new URL(trimmed, "https://startkiter.aiver.me");
		if (url.origin !== "https://startkiter.aiver.me") {
			return "/course";
		}
		if (
			!url.pathname.startsWith("/") ||
			url.pathname.startsWith("//") ||
			url.pathname.includes("\\") ||
			url.pathname.includes("..") ||
			url.username ||
			url.password
		) {
			return "/course";
		}
		const destination = `${url.pathname}${url.search}${url.hash}` || "/course";
		if (!destination.startsWith("/") || destination.startsWith("//")) {
			return "/course";
		}
		return destination;
	} catch {
		return "/course";
	}
}

export function LoginForm({
	mode,
	googleEnabled,
	lineEnabled,
	nextPath,
}: {
	mode: AuthMode;
	googleEnabled: boolean;
	lineEnabled: boolean;
	nextPath?: string;
}) {
	const [error, setError] = useState<string | null>(null);
	const isSignUp = mode === "sign-up";
	const destination = safeNextPath(nextPath);
	const enabledSocialProviders: Record<SocialProviderId, boolean> = {
		google: googleEnabled,
		line: lineEnabled,
	};
	const visibleSocialProviders = AUTH_SOCIAL_PROVIDERS.filter((provider) => enabledSocialProviders[provider.id]);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		const values = new FormData(event.currentTarget);
		try {
			const response = await fetch(`/api/auth/${isSignUp ? "sign-up" : "sign-in"}/email`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(Object.fromEntries(values.entries())),
			});

			if (!response.ok) {
				setError(isSignUp ? "無法建立帳號，請檢查資料後再試。" : "Email 或密碼不正確。");
				return;
			}

			window.location.assign(destination);
		} catch {
			setError("網路異常，請稍後再試。");
		}
	}

	async function socialSignIn(provider: "google" | "line") {
		setError(null);
		try {
			const response = await fetch("/api/auth/sign-in/social", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ provider, callbackURL: destination }),
			});
			const result = (await response.json()) as { url?: string };

			if (!response.ok || !result.url) {
				setError("這個登入方式目前無法使用。");
				return;
			}

			window.location.assign(result.url);
		} catch {
			setError("網路異常，請稍後再試。");
		}
	}

	return (
		<>
			<Form>
				<form className="form" onSubmit={submit}>
					{isSignUp ? (
						<label>
							名稱
							<Input name="name" autoComplete="name" required />
						</label>
					) : null}
					<label>
						Email
						<Input name="email" type="email" autoComplete="email" required />
					</label>
					<label>
						密碼
						<Input
							name="password"
							type="password"
							minLength={8}
							autoComplete={isSignUp ? "new-password" : "current-password"}
							required
						/>
					</label>
					<Button type="submit" variant="primary">
						{isSignUp ? "建立帳號" : "登入"}
					</Button>
				</form>
			</Form>
			{error ? (
				<p className="error" role="alert">
					{error}
				</p>
			) : null}
			{!isSignUp && visibleSocialProviders.length > 0 ? (
				<div className="provider-actions" aria-label="社群登入">
					{visibleSocialProviders.map((provider) => (
						<Button
							key={provider.id}
							className="button secondary"
							type="button"
							variant="outline"
							onClick={() => socialSignIn(provider.id)}
						>
							{provider.label}
						</Button>
					))}
				</div>
			) : null}
		</>
	);
}
