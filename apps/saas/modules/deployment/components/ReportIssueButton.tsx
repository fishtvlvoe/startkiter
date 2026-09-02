"use client";

import { Button, type ButtonProps } from "@startkiter/ui/components/button";
import { MessageSquare } from "lucide-react";
import React from "react";

import {
	buildDeploymentSupportBody,
	buildSupportMailto,
	isEmailSupportMode,
	SUPPORT_MAIL_SUBJECT,
} from "../support-channel";

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

/** email 模式：開啟預填部署資訊的信件，取代 Chatwoot 對話框 */
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
		if (isEmailSupportMode()) {
			openSupportMailForDeployment(buyerDeploymentId);
		} else {
			openChatwootWithDeployment(buyerDeploymentId);
		}
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
