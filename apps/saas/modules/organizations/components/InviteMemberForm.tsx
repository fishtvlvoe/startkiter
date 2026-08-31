"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationRoleSelect } from "@organizations/components/OrganizationRoleSelect";
import { fullOrganizationQueryKey } from "@organizations/lib/api";
import { inviteMemberFormSchema } from "@organizations/lib/invite-member-form.schema";
import { authClient } from "@startkiter/auth/client";
import { Button } from "@startkiter/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@startkiter/ui/components/form";
import { Input } from "@startkiter/ui/components/input";
import { toastError, toastSuccess } from "@startkiter/ui/components/toast";
import { SettingsItem } from "@shared/components/SettingsItem";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

export function InviteMemberForm({ organizationId }: { organizationId: string }) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const form = useForm({
		resolver: zodResolver(inviteMemberFormSchema),
		defaultValues: {
			email: "",
			role: "user" as const,
		},
	});

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const { error } = await authClient.organization.inviteMember({
				...values,
				organizationId,
			});

			if (error) {
				throw error;
			}

			form.reset();

			await queryClient.invalidateQueries({
				queryKey: fullOrganizationQueryKey(organizationId),
			});

			toastSuccess(t("organizations.settings.members.inviteMember.notifications.success.title"));
		} catch {
			toastError(t("organizations.settings.members.inviteMember.notifications.error.title"));
		}
	});

	return (
		<SettingsItem
			title={t("organizations.settings.members.inviteMember.title")}
			description={t("organizations.settings.members.inviteMember.description")}
		>
			<Form {...form}>
				<form onSubmit={onSubmit} className="@container">
					<div className="@md:flex-row gap-2 flex flex-col">
						<div className="flex-1">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("organizations.settings.members.inviteMember.email")}</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div>
							<FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("organizations.settings.members.inviteMember.role")}</FormLabel>
										<FormControl>
											<OrganizationRoleSelect
												value={field.value}
												onSelect={field.onChange}
												excludeRoles={["owner"]}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
					</div>

					<div className="mt-4 flex justify-end">
						<Button type="submit" loading={form.formState.isSubmitting}>
							{t("organizations.settings.members.inviteMember.submit")}
						</Button>
					</div>
				</form>
			</Form>
		</SettingsItem>
	);
}
