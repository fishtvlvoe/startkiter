import { db, VideoProvider, PublishStatus } from "./index";

async function main() {
	console.log("Seeding 電馭學院 (StartKiter Academy) Course Data...");

	// 1. 建立或更新電馭學院 Course
	const course = await db.course.upsert({
		where: { slug: "startkiter-academy" },
		update: {},
		create: {
			slug: "startkiter-academy",
			title: "電馭學院 (StartKiter Academy) 官方全套實戰課",
			description: "從零構建全端 SaaS 買斷包、PAYUNi 金流閉環與 Fluent Player 統一影音架構。",
			status: PublishStatus.PUBLISHED,
		},
	});

	// 2. 建立第 1 章：代碼庫架構與基礎
	const ch1 = await db.chapter.create({
		data: {
			courseId: course.id,
			title: "第 1 章：代碼庫架構與基礎",
			order: 1,
			lessons: {
				create: [
					{
						slug: "1-1-architecture-overview",
						title: "1-1 商業與產品架構總覽 (電馭學院)",
						order: 1,
						status: PublishStatus.PUBLISHED,
						isFreePreview: true,
						videoProvider: VideoProvider.BUNNY,
						videoUrl: "https://iframe.mediadelivery.net/play/12345/bunny-demo",
						videoDuration: "14:20",
						content: `# 1-1 商業與產品架構總覽

歡迎來到電馭學院！

本單元介紹 StartKiter 的核心精神：買斷制終身代碼包、微內核 4 Mount Points 與統一播放器架構。`,
						aiContext: "本單元重點：電馭學院整體架構、三大門戶與微內核 4 Mount Points 註冊規範。",
					},
					{
						slug: "1-2-deployment-domains",
						title: "1-2 部署與網域綁定",
						order: 2,
						status: PublishStatus.PUBLISHED,
						isFreePreview: false,
						videoProvider: VideoProvider.YOUTUBE,
						videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
						videoDuration: "21:05",
						content: `# 1-2 部署與網域綁定

如何一鍵將專案部署至 Coolify VPS 或 Vercel。`,
						aiContext: "本單元重點：Coolify 與 Vercel 部署流程、環境變數與安全設定。",
					},
				],
			},
		},
	});

	// 3. 建立第 2 章：金流與會員權限
	const ch2 = await db.chapter.create({
		data: {
			courseId: course.id,
			title: "第 2 章：金流與會員權限",
			order: 2,
			lessons: {
				create: [
					{
						slug: "2-1-payuni-checkout",
						title: "2-1 PAYUNi 台灣金流全解析",
						order: 1,
						status: PublishStatus.PUBLISHED,
						isFreePreview: false,
						videoProvider: VideoProvider.VIMEO,
						videoUrl: "https://vimeo.com/123456789",
						videoDuration: "18:40",
						content: `# 2-1 PAYUNi 台灣金流全解析

一次買斷 TWD 8,800 實作、WebHook 驗簽與訂單狀態閉環。`,
						aiContext: "本單元重點：PAYUNi 信用卡與 ATM 虛擬帳號結帳閉環、訂單 courseAccess 欄位更新。",
					},
				],
			},
		},
	});

	// 4. 建立 Studio 資料夾
	const folder1 = await db.studioFolder.create({
		data: {
			name: "產品業務",
			order: 1,
			isCollapsed: false,
		},
	});

	const folder2 = await db.studioFolder.create({
		data: {
			name: "營運管理",
			order: 2,
			isCollapsed: false,
		},
	});

	console.log("✅ Seed 資料注入成功！Course ID:", course.id);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
