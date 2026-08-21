import { getSession } from "@auth/lib/server";
import { Logo } from "@startkiter/ui";
import { SettingsMenu } from "@settings/components/SettingsMenu";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function AccountSettingsLayout({ children }: PropsWithChildren) {
	const t = await getTranslations("settings.menu.account");
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return (
		<>
			<SettingsMenu
				className="mb-6"
				menuItems={[
					{
						avatar: <Logo className="size-8" withLabel={false} />,
						title: t("title"),
						items: [
							{ title: t("general"), href: "/settings/general" },
							{ title: t("security"), href: "/settings/security" },
							{ title: t("billing"), href: "/settings/billing" },
							{ title: t("notifications"), href: "/settings/notifications" },
						],
					},
				]}
			/>

			{children}
		</>
	);
}
