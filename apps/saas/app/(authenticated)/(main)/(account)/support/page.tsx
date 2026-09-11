import {
	buildSupportMailto,
	getSupportEmail,
} from "@deployment/support-channel";
import { PageHeader } from "@shared/components/PageHeader";
import { Card } from "@startkiter/ui";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations("support");

	return {
		title: t("title"),
	};
}

export default async function SupportPage() {
	const t = await getTranslations("support");
	const supportEmail = getSupportEmail();
	const mailto = buildSupportMailto({
		subject: t("mailSubject"),
		body: t("mailBody"),
	});

	return (
		<div className="max-w-2xl">
			<PageHeader
				title={t("title")}
				subtitle={t("subtitle")}
			/>

			<Card className="space-y-4 p-6">
				<p className="text-sm text-foreground/80">
					{t("description")}
				</p>

				{supportEmail ? (
					<div className="space-y-2">
						<p className="text-sm">
							{t("emailLabel")}{" "}
							<a className="text-primary underline" href={mailto ?? `mailto:${supportEmail}`}>
								{supportEmail}
							</a>
						</p>
						{mailto ? (
							<a
								className="inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
								href={mailto}
							>
								{t("openEmail")}
							</a>
						) : null}
					</div>
				) : (
					<p className="text-sm text-destructive">
						{t("notConfigured")}
					</p>
				)}
			</Card>
		</div>
	);
}
