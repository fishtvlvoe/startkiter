import { MVP_SKU } from "@startkiter/payments/constants";

export type CourseAccessOrderRow = {
	sku: string;
	courseAccess: boolean;
};

export type CourseAccessReader = {
	findOrdersForUser: (userId: string) => Promise<CourseAccessOrderRow[]>;
};

/** Entitlement：至少一筆 sku=startkiter-mvp 且 courseAccess=true。 */
export async function canAccessCourse(userId: string, reader: CourseAccessReader): Promise<boolean> {
	if (!userId) {
		return false;
	}
	const rows = await reader.findOrdersForUser(userId);
	return rows.some((row) => row.sku === MVP_SKU && row.courseAccess === true);
}

/**
 * Bundle-aware 課程存取權判斷。
 *
 * ponytail: Order 資料表目前沒有獨立的 bundleId／productId 欄位（那是 Phase 4 商品目錄改造才會補的
 * 正式欄位）。Phase 2 沿用既有 `sku` 欄位當作商品識別碼：買 bundle 時 `sku` 存 bundle 自己的 id，
 * 買 MVP 單一課程時 `sku` 維持 `startkiter-mvp` 不變。這裡不假設 sku 的具體格式，只透過
 * `findBundleCourseIds` 反查該 sku 是否對應一個 bundle，找不到就代表不是 bundle 訂單。
 * 升級路徑：Phase 4 若替 Order 加上正式 `productId` 欄位，只需替換 reader 實作，函式簽章不用變。
 */
export type BundleCourseAccessReader = {
	/** 該買家目前 courseAccess=true 的訂單 sku 清單（退款後 courseAccess 會被清成 false，因此自動排除）。 */
	findGrantedSkusForUser: (userId: string) => Promise<string[]>;
	/** 查詢某個 sku 是否對應一個 bundle；是的話回傳該 bundle 內的 courseId 清單，不是則回傳 null。 */
	findBundleCourseIds: (sku: string) => Promise<string[] | null>;
};

/**
 * 判斷 buyer 對指定 courseId 是否有存取權：買家名下任一 courseAccess=true 的訂單，
 * 若該訂單 sku 對應的 bundle 包含這個 courseId，即視為有存取權。
 */
export async function canAccessCourseId(
	userId: string,
	courseId: string,
	reader: BundleCourseAccessReader,
): Promise<boolean> {
	if (!userId || !courseId) {
		return false;
	}
	const grantedSkus = await reader.findGrantedSkusForUser(userId);
	for (const sku of grantedSkus) {
		if (sku === MVP_SKU) {
			return true;
		}

		const bundleCourseIds = await reader.findBundleCourseIds(sku);
		if (bundleCourseIds?.includes(courseId)) {
			return true;
		}
	}
	return false;
}
