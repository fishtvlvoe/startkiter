import { config } from "@config";
import { cn, Logo } from "@startkiter/ui";
import type { PropsWithChildren } from "react";

import { Footer } from "./Footer";

export async function AuthWrapper({
	children,
	contentClass,
}: PropsWithChildren<{ contentClass?: string }>) {
	return (
		<div className="py-6 flex min-h-screen w-full">
			<div className="gap-8 flex w-full flex-col items-center justify-between">
				<div className="container">
					<div className="flex items-center justify-between">
						<a href={config.marketingUrl ?? "/"} className="block">
							<Logo withLabel={false} />
						</a>
					</div>
				</div>

				<div className="container flex justify-center">
					<main className={cn("max-w-md w-full", contentClass)}>{children}</main>
				</div>

				<Footer />
			</div>
		</div>
	);
}
