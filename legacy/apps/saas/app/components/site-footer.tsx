import Link from "next/link";

import { resolveSupportEmail } from "../../lib/support-email";

type SiteFooterProps = {
	supportEmail?: string | null;
};

export { resolveSupportEmail };

export function SiteFooter({ supportEmail }: SiteFooterProps) {
	if (!supportEmail) {
		return null;
	}

	return (
		<footer className="site-footer">
			<p className="muted">
				客服：{" "}
				<a href={`mailto:${supportEmail}`}>{supportEmail}</a>
				{" · "}
				<Link href="/">開站包</Link>
			</p>
		</footer>
	);
}
