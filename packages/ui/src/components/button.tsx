import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "../lib";
import { Spinner } from "./spinner";

const buttonVariants = cva(
	"flex items-center justify-center font-semibold enabled:cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&>svg]:mr-1.5 [&>svg+svg]:hidden",
	{
		variants: {
			variant: {
				primary:
					"bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--primary)90%,white)]",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary)90%,black)]",
				outline:
					"border border-foreground/10 bg-transparent text-foreground hover:bg-foreground/10",
				ghost: "text-foreground hover:bg-foreground/10 hover:text-foreground",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-[color-mix(in_srgb,var(--destructive)90%,black)]",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				sm: "h-6 rounded-full px-3 text-xs",
				md: "h-9 rounded-full px-4 text-sm",
				lg: "h-12 rounded-full px-6 text-base",
				icon: "size-8 rounded-full [&>svg]:m-0",
			},
		},
		defaultVariants: {
			variant: "secondary",
			size: "md",
		},
	},
);

export type ButtonProps = {
	asChild?: boolean;
	loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

const Button = ({
	className,
	children,
	variant,
	size,
	asChild = false,
	loading,
	disabled,
	...props
}: ButtonProps) => {
	const Comp = asChild ? SlotPrimitive.Slot : "button";
	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={disabled || loading}
			{...props}
		>
			{loading && <Spinner className="mr-1.5 size-4 text-inherit" />}
			<SlotPrimitive.Slottable>{children}</SlotPrimitive.Slottable>
		</Comp>
	);
};

export { Button, buttonVariants };
