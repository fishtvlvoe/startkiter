import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/client";
import {
	bumpPublishedContentCacheGeneration,
	isCourseContentWrite,
} from "./published-content-cache-generation";

const prismaClientSingleton = () => {
	if (!process.env.DATABASE_URL) {
		throw new Error("DATABASE_URL is not set");
	}

	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL,
	});

	return new PrismaClient({ adapter }).$extends({
		name: "publishedContentCacheInvalidation",
		query: {
			async $allOperations({ model, operation, args, query }) {
				const result = await query(args);

				if (isCourseContentWrite(model, operation)) {
					bumpPublishedContentCacheGeneration();
				}

				return result;
			},
		},
	});
};

type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

declare global {
	var prisma: ExtendedPrismaClient | undefined;
}

// oxlint-disable-next-line no-redeclare -- This is a singleton
const prisma = globalThis.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
	globalThis.prisma = prisma;
}

export { prisma as db };
