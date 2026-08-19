"use client";

import { Button, type ButtonProps } from "@startkiter/ui/components/button";
import { MessageSquare } from "lucide-react";
import React from "react";

export interface ReportIssueButtonProps extends Omit<ButtonProps, "onClick"> {
	buyerDeploymentId?: string | null;
	onReportClick?: () => void;
}

export function openChatwootWithDeployment(buyerDeploymentId?: string | null) {
	if (typeof window === "undefined" || !window.$chatwoot) {
		return;
	}

	if (buyerDeploymentId) {
		window.$chatwoot.setCustomAttributes({
			buyerDeploymentId,
		});
	}

	window.$chatwoot.toggle("open");
}

export function ReportIssueButton({
	buyerDeploymentId,
	children,
	className,
	variant = "outline",
	size = "md",
	onReportClick,
	...props
}: ReportIssueButtonProps) {
	const handleClick = () => {
		openChatwootWithDeployment(buyerDeploymentId);
		onReportClick?.();
	};

	return (
		<Button
			type="button"
			variant={variant}
			size={size}
			className={className}
			onClick={handleClick}
			{...props}
		>
			<MessageSquare className="h-4 w-4 mr-2" />
			{children || "回報這個部署的問題"}
		</Button>
	);
}
