import { auth } from "@startkiter/auth";
import { db } from "@startkiter/database";
import { MOUNT_POINTS } from "@startkiter/platform/src/mount-points";
import { NextResponse } from "next/server";

import { operatorHttpStatus } from "../../../lib/operator";

const KNOWN_MENU_ITEM_IDS = new Set(MOUNT_POINTS.map((plugin) => plugin.id));

type SidebarGroupInput = {
	id: string;
	title: string;
	order: number;
	isCollapsed: boolean;
};

type SidebarGroupItemInput = {
	id: string;
	groupId: string;
	menuItemId: string;
	order: number;
};

export async function GET(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user?.id) {
		return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
	}

	const [groups, items] = await Promise.all([
		db.sidebarGroup.findMany({ orderBy: { order: "asc" } }),
		db.sidebarGroupItem.findMany({ orderBy: { order: "asc" } }),
	]);

	// SidebarGroup 尚未初始化時回空陣列，前端 fallback 用 MOUNT_POINTS 預設順序渲染
	// （design.md failure mode：不因為排序表是空的就不渲染選單）。
	return NextResponse.json({
		groups: groups.map((g) => ({
			id: g.id,
			title: g.title,
			order: g.order,
			isCollapsed: g.isCollapsed,
		})),
		items: items.map((i) => ({
			id: i.id,
			groupId: i.groupId,
			menuItemId: i.menuItemId,
			order: i.order,
		})),
	});
}

export async function PUT(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	const status = operatorHttpStatus(session, process.env.ADMIN_EMAIL);
	if (status) {
		return NextResponse.json({ error: status === 401 ? "UNAUTHORIZED" : "FORBIDDEN" }, { status });
	}

	let body: { groups?: SidebarGroupInput[]; items?: SidebarGroupItemInput[] };
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
	}

	const groups = Array.isArray(body.groups) ? body.groups : [];
	const items = Array.isArray(body.items) ? body.items : [];

	// menuItemId 必須對應目前 MOUNT_POINTS 裡的合法 Plugin id，不存在的項目拒絕該筆寫入，
	// 但不能因為一筆壞資料擋掉其他合法項目（design.md failure mode）。
	const validItems = items.filter((item) => KNOWN_MENU_ITEM_IDS.has(item.menuItemId));
	const rejected = items
		.filter((item) => !KNOWN_MENU_ITEM_IDS.has(item.menuItemId))
		.map((item) => item.menuItemId);

	await db.$transaction(async (tx) => {
		await tx.sidebarGroupItem.deleteMany({});
		await tx.sidebarGroup.deleteMany({});

		if (groups.length > 0) {
			await tx.sidebarGroup.createMany({
				data: groups.map((group) => ({
					id: group.id,
					title: group.title,
					order: group.order,
					isCollapsed: group.isCollapsed,
				})),
			});
		}

		if (validItems.length > 0) {
			await tx.sidebarGroupItem.createMany({
				data: validItems.map((item) => ({
					id: item.id,
					groupId: item.groupId,
					menuItemId: item.menuItemId,
					order: item.order,
				})),
			});
		}
	});

	if (rejected.length > 0) {
		return NextResponse.json({ error: "INVALID_MENU_ITEM_ID", rejected }, { status: 400 });
	}

	return NextResponse.json({ success: true });
}
