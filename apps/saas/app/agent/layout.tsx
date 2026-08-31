import type { PropsWithChildren } from "react";

import AuthenticatedLayout from "../(authenticated)/layout";
import MainLayout from "../(authenticated)/(main)/layout";
import UserLayout from "../(authenticated)/(main)/(account)/layout";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgentLayout({ children }: PropsWithChildren) {
	return (
		<AuthenticatedLayout>
			<MainLayout>
				<UserLayout>{children}</UserLayout>
			</MainLayout>
		</AuthenticatedLayout>
	);
}
