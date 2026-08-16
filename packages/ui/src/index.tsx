import type { ReactNode } from "react";

export { Badge } from "./components/badge";
export { ColorModeToggle } from "./components/color-mode-toggle";
export { Button, buttonVariants } from "./components/button";
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/card";
export {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "./components/form";
export { Input } from "./components/input";

export function Panel({ children }: { children: ReactNode }) {
	return <section className="panel">{children}</section>;
}
