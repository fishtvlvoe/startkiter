export function getSupportEmail(): string | null {
	const raw = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
	return raw ? raw : null;
}

export function buildSupportMailto(args: { subject: string; body: string }): string | null {
	const to = getSupportEmail();
	if (!to) {
		return null;
	}

	const params = new URLSearchParams({ subject: args.subject, body: args.body });
	// URLSearchParams 把空白編成 "+"，mailto: 的 subject/body 需要 %20 才會被信件軟體正確解讀
	return `mailto:${to}?${params.toString().replace(/\+/g, "%20")}`;
}

export const SUPPORT_MAIL_SUBJECT = "客服諮詢";

export function buildDeploymentSupportBody(args: {
	deploymentId?: string | null;
	publicUrl?: string | null;
}): string {
	const lines = ["請描述你遇到的問題：", "", "", "---- 以下為系統自動帶入，請勿刪除 ----"];
	if (args.deploymentId) {
		lines.push(`部署 ID：${args.deploymentId}`);
	}
	if (args.publicUrl) {
		lines.push(`網站網址：${args.publicUrl}`);
	}
	return lines.join("\n");
}
