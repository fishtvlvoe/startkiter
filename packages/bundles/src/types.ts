/** 對應 `packages/database` 的 `Bundle` Prisma model（design.md Implementation Contract）。 */
export type Bundle = {
	id: string;
	slug: string;
	title: string;
	description: string | null;
	priceTwd: number;
	status: "draft" | "published" | "archived";
	/** 對應 `packages/course` 現有課程的 id，透過 BundleCourse 關聯表取得。 */
	courseIds: string[];
};
