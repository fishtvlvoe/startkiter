import { PrismaClient } from "@prisma/client";

const clients = new Map<string, PrismaClient>();

export function createDatabase(databaseUrl = process.env.DATABASE_URL): PrismaClient {
	const connectionString = databaseUrl?.trim();

	if (!connectionString) {
		throw new Error("DATABASE_URL is not set");
	}

	const existingClient = clients.get(connectionString);
	if (existingClient) {
		return existingClient;
	}

	const client = new PrismaClient({
		datasources: { db: { url: connectionString } },
	});
	clients.set(connectionString, client);
	return client;
}

export type DatabaseClient = ReturnType<typeof createDatabase>;
