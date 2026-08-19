"use client";

import { config } from "@config";
import { authClient } from "@startkiter/auth/client";
import { Button } from "@startkiter/ui/components/button";
import { toastError } from "@startkiter/ui/components/toast";
import { useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";

import { oAuthProviders } from "../constants/oauth-providers";

export function SocialSigninButton({
	provider,
	className,
}: {
	provider: keyof typeof oAuthProviders;
	className?: string;
}) {
	const t = useTranslations();
	const [invitationId] = useQueryState("invitationId", parseAsString);
	const providerData = oAuthProviders[provider];

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: config.redirectAfterSignIn;

	const onSignin = async () => {
		const callbackURL = new URL(redirectPath, window.location.origin);
		const { error } = await authClient.signIn.social({
			provider,
			callbackURL: callbackURL.toString(),
		});

		if (error) {
			toastError(t("auth.login.hints.socialSigninFailed"));
		}
	};

	return (
		<Button onClick={() => onSignin()} variant="secondary" type="button" className={className}>
			{providerData.icon && (
				<providerData.icon className="mr-2 size-4 text-primary" />
			)}
			{providerData.name}
		</Button>
	);
}
