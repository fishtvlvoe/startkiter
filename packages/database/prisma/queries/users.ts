import type { z } from "zod";

import { db } from "../client";
import type { UserSchema } from "../zod";

type UserRoleFilter = "all" | "student" | "instructor" | "admin";

function roleFilter(role: UserRoleFilter) {
	if (role === "admin") return { role: "admin" };
	if (role === "instructor") {
		return { OR: [{ role: "instructor" }, { courseInstructorAssignments: { some: {} } }] };
	}
	if (role === "student") {
		return { role: { notIn: ["admin", "instructor"] }, courseInstructorAssignments: { none: {} } };
	}
	return {};
}

export async function getUsers({
	limit,
	offset,
	query,
	role,
}: {
	limit: number;
	offset: number;
	query?: string;
	role?: UserRoleFilter;
}) {
	const selectedRoleFilter = roleFilter(role ?? "all");
	return await db.user.findMany({
		where: {
			...selectedRoleFilter,
			...(query
				? {
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							email: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
				}
				: {}),
		},
		take: limit,
		skip: offset,
	});
}

export async function countAllUsers({ query, role }: { query?: string; role?: UserRoleFilter }) {
	const selectedRoleFilter = roleFilter(role ?? "all");
	return await db.user.count({
		where: {
			...selectedRoleFilter,
			...(query
				? {
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							email: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
				}
				: {}),
		},
	});
}

export async function getUserById(id: string) {
	return await db.user.findUnique({
		where: {
			id,
		},
	});
}

export async function getUserByEmail(email: string) {
	return await db.user.findUnique({
		where: {
			email,
		},
	});
}

export async function createUser({
	email,
	name,
	role,
	emailVerified,
	onboardingComplete,
}: {
	email: string;
	name: string;
	role: "admin" | "user";
	emailVerified: boolean;
	onboardingComplete: boolean;
}) {
	return await db.user.create({
		data: {
			email,
			name,
			role,
			emailVerified,
			onboardingComplete,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function getAccountById(id: string) {
	return await db.account.findUnique({
		where: {
			id,
		},
	});
}

export async function createUserAccount({
	userId,
	providerId,
	accountId,
	hashedPassword,
}: {
	userId: string;
	providerId: string;
	accountId: string;
	hashedPassword?: string;
}) {
	return await db.account.create({
		data: {
			userId,
			accountId,
			providerId,
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function updateUser(user: Partial<z.infer<typeof UserSchema>> & { id: string }) {
	return await db.user.update({
		where: {
			id: user.id,
		},
		data: user,
	});
}
