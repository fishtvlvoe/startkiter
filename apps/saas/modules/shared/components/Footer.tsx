import { cn } from "@startkiter/ui";
import { config } from "@config";

export function Footer() {
	return (
		<footer className={cn("max-w-6xl py-6 text-xs container text-center text-foreground/60")}>
			<span>© {new Date().getFullYear()} {config.appName}</span>
		</footer>
	);
}
