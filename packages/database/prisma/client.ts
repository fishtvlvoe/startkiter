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
		max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX, 10) : 25,
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

// Extension only adds query middleware (cache generation bump) and does not
// change the client API. Keep the public type as PrismaClient so callers that
// expect Prisma.TransactionClient / fluent-free delegates stay compatible —
// $extends otherwise produces structurally incompatible transaction + mock types.
export const db = prisma as unknown as PrismaClient;
