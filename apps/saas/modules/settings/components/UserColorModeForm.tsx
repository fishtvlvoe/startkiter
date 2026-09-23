"use client";
import { ColorModeToggle } from "@startkiter/ui";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useTranslations } from "next-intl";
export function UserColorModeForm() {
	const t = useTranslations();
	return (
		<SettingsItem
			title={t("settings.account.colorMode.title")}
			description={t("settings.account.colorMode.description")}
		>
			<ColorModeToggle
				modes={["system", "light", "dark"]}
				labels={{
					system: t("common.colorMode.system"),
					light: t("common.colorMode.light"),
					dark: t("common.colorMode.dark"),
				}}
			/>
		</SettingsItem>
	);
}
