"use client";

import { Button, type ButtonProps } from "@startkiter/ui/components/button";
import { MessageSquare } from "lucide-react";
import React from "react";

import { buildDeploymentSupportBody, buildSupportMailto, SUPPORT_MAIL_SUBJECT } from "../support-channel";

export interface ReportIssueButtonProps extends Omit<ButtonProps, "onClick"> {
	buyerDeploymentId?: string | null;
	onReportClick?: () => void;
}

/** 開啟預填部署資訊的客服信件。 */
export function openSupportMailForDeployment(buyerDeploymentId?: string | null): string | null {
	const href = buildSupportMailto({
		subject: SUPPORT_MAIL_SUBJECT,
		body: buildDeploymentSupportBody({ deploymentId: buyerDeploymentId }),
	});

	if (href && typeof window !== "undefined") {
		window.location.href = href;
	}

	return href;
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
		openSupportMailForDeployment(buyerDeploymentId);
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
