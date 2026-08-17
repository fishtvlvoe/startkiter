import Link from "next/link";

import { getMessagesForLocale } from "@startkiter/i18n";
import { Badge, Button, Card } from "@startkiter/ui";

import { SiteNav } from "./components/site-nav";
import { getRequestLocale } from "../lib/request-locale";

type HomeMessages = {
	brand: string;
	home: {
		title: string;
		description: string;
		buyCta: string;
		loginCta: string;
	};
};

function CheckIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.15" />
			<path d="M4.5 8.2 6.7 10.4 11.5 5.6" stroke="currentColor" strokeWidth="1.6" />
		</svg>
	);
}

export default async function HomePage() {
	const locale = await getRequestLocale();
	const messages = await getMessagesForLocale<HomeMessages>(locale, "marketing");

	return (
		<main className="home-main">
			<div className="ds-container">
				<SiteNav locale={locale} />
			</div>
			<section className="ds-container" style={{ padding: "4rem 0 2rem", textAlign: "center" }}>
				<Badge className="ds-badge">一次買斷 · 課與終身代碼包</Badge>
				<h1
					style={{
						maxWidth: "18ch",
						margin: "1rem auto 0",
						fontSize: "clamp(2.4rem, 6vw, 4.4rem)",
						fontWeight: 500,
						letterSpacing: "-0.05em",
						lineHeight: 1.1,
					}}
				>
					{messages.home.title}
				</h1>
				<p className="ds-muted" style={{ maxWidth: "36rem", margin: "0.85rem auto 0", fontSize: "1.125rem" }}>
					{messages.home.description}
				</p>
				<ul className="check-list">
					<li>
						<CheckIcon />
						課程觀看權限一次開通
					</li>
					<li>
						<CheckIcon />
						終身 GitHub 代碼包
					</li>
					<li>
						<CheckIcon />
						PAYUNi 結帳，台幣買斷
					</li>
					<li>
						<CheckIcon />
						LINE 學員社群用邀請連結，不靜默入群
					</li>
				</ul>
				<div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
					<Button
						variant="primary"
						size="lg"
						className="ds-btn"
						data-variant="primary"
						data-size="lg"
						render={(props) => <Link {...props} href="/checkout">{messages.home.buyCta}</Link>}
					/>
					<Button
						variant="ghost"
						size="lg"
						className="ds-btn"
						data-variant="ghost"
						data-size="lg"
						render={(props) => <Link {...props} href="/login">{messages.home.loginCta}</Link>}
					/>
				</div>
				<div className="hero-frame" aria-hidden="true">
					<div className="hero-screen">
						<div className="hero-screen-bar">
							<span />
							<span />
							<span />
						</div>
						<div className="hero-screen-grid">
							<div className="hero-screen-side" />
							<div className="hero-screen-main">
								<div className="stat-bar" style={{ height: "4.5rem", margin: "0.5rem" }} />
								<div className="stat-bar" style={{ height: "8rem", margin: "0.5rem" }} />
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="ds-container" style={{ padding: "3rem 0" }}>
				<p
					className="ds-muted"
					style={{
						textAlign: "center",
						fontSize: "0.75rem",
						letterSpacing: "0.12em",
						textTransform: "uppercase",
						fontWeight: 600,
						color: "var(--primary)",
					}}
				>
					社會認同
				</p>
				<div className="proof-grid" style={{ marginTop: "1rem" }}>
					<Card className="ds-card proof-card">
						<p style={{ margin: 0, fontWeight: 600 }}>一次買斷 NT$8,800</p>
						<p className="ds-muted" style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
							沒有月費。課與終身代碼包同一 SKU。
						</p>
					</Card>
					<Card className="ds-card proof-card">
						<p style={{ margin: 0, fontWeight: 600 }}>帳單掛在使用者</p>
						<p className="ds-muted" style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
							不做 Organization 多租戶。金流走 PAYUNi。
						</p>
					</Card>
					<Card className="ds-card proof-card">
						<p style={{ margin: 0, fontWeight: 600 }}>退款即取消領取</p>
						<p className="ds-muted" style={{ margin: "0.4rem 0 0", fontSize: "0.9rem" }}>
							退款後課程與 GitHub kit 資格一併取消。
						</p>
					</Card>
				</div>
			</section>

			<section id="features" className="ds-container" style={{ padding: "1rem 0 4rem" }}>
				<div style={{ maxWidth: "40rem", margin: "0 auto 2rem", textAlign: "center" }}>
					<p
						className="ds-muted"
						style={{
							fontSize: "0.75rem",
							letterSpacing: "0.12em",
							textTransform: "uppercase",
							fontWeight: 600,
							color: "var(--primary)",
						}}
					>
						功能深潛
					</p>
					<h2 style={{ margin: "0.4rem 0 0", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 500, letterSpacing: "-0.04em" }}>
						站、課、代碼包，同一套系統
					</h2>
					<p className="ds-muted" style={{ margin: "0.6rem 0 0" }}>
						前台賣、後台學、kit 履約。版面比照已確認的首頁 demo。
					</p>
				</div>
				<Card className="ds-card feature-block">
					<div className="feature-grid">
						<div className="hero-screen" style={{ minHeight: "12rem" }} />
						<div>
							<h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 500 }}>課程觀看。</h3>
							<p className="ds-muted" style={{ margin: "0.75rem 0 0" }}>
								買完直接進課。權限跟訂單綁在一起，不是另外一套學院後台。
							</p>
						</div>
					</div>
					<div className="highlight-grid">
						<div className="highlight-card">
							<strong>進度跟自己走</strong>
							<p className="ds-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
								站內 agent 只能查自己的課程進度。
							</p>
						</div>
						<div className="highlight-card">
							<strong>中英混排</strong>
							<p className="ds-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
								Inter 接系統 fallback，中文與「取得開站包 NT$8,800」保持可讀。
							</p>
						</div>
						<div className="highlight-card">
							<strong>同一套元件</strong>
							<p className="ds-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
								按鈕、卡片、徽章都走移植後的 design token，不是手估色號。</p>
						</div>
					</div>
				</Card>
				<Card className="ds-card feature-block">
					<div className="feature-grid">
						<div className="hero-screen" style={{ minHeight: "12rem" }} />
						<div>
							<h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 500 }}>GitHub kit。</h3>
							<p className="ds-muted" style={{ margin: "0.75rem 0 0" }}>
								課與終身代碼包同一筆訂單。退款後領取資格取消。
							</p>
						</div>
					</div>
				</Card>
			</section>
		</main>
	);
}
