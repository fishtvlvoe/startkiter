import { AcademyClassroomClient } from "./classroom-client";

type LessonPageProps = {
	params: Promise<{ lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
	const { lessonId } = await params;

	// 預設電馭學院課綱資料
	const mockCurriculum = [
		{
			id: "ch1",
			title: "第 1 章：代碼庫架構與基礎",
			lessons: [
				{
					id: "l1",
					title: "1-1 商業與產品架構總覽 (電馭學院)",
					duration: "14:20",
					isFreePreview: true,
					videoUrl: "https://iframe.mediadelivery.net/play/12345/bunny-demo",
					provider: "BUNNY",
					content: "# 1-1 商業與產品架構總覽\n\n歡迎來到電馭學院！",
					aiContext: "本單元重點：電馭學院整體架構、三大門戶與微內核 Mount Points。",
				},
				{
					id: "l2",
					title: "1-2 部署與網域綁定",
					duration: "21:05",
					isFreePreview: false,
					videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
					provider: "YOUTUBE",
					content: "# 1-2 部署與網域綁定\n\n如何一鍵部署到 Coolify/Vercel。",
					aiContext: "本單元重點：Coolify 與 Vercel 部署流程。",
				},
			],
		},
		{
			id: "ch2",
			title: "第 2 章：金流與會員權限",
			lessons: [
				{
					id: "l3",
					title: "2-1 PAYUNi 台灣金流全解析",
					duration: "18:40",
					isFreePreview: false,
					videoUrl: "https://vimeo.com/123456789",
					provider: "VIMEO",
					content: "# 2-1 PAYUNi 金流\n\n一次買斷 TWD 8,800 實作。",
					aiContext: "本單元重點：PAYUNi 信用卡與 ATM 虛擬帳號結帳閉環。",
				},
			],
		},
	];

	const allLessons = mockCurriculum.flatMap((c) => c.lessons);
	const initialLesson = allLessons.find((l) => l.id === lessonId) || allLessons[0];

	return <AcademyClassroomClient initialLesson={initialLesson} curriculum={mockCurriculum} />;
}
