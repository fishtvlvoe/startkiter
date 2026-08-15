import { memoryAdapter, type MemoryDB } from "@better-auth/memory-adapter";

import { createAuth, type AuthEnvironment } from "./auth";

const defaultTestEnvironment: AuthEnvironment = {
	DATABASE_URL: "postgresql://test:test@localhost:5432/startkiter",
	BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-for-better-auth",
	BETTER_AUTH_URL: "http://localhost",
};

export function createTestAuth(overrides: AuthEnvironment = {}) {
	const database: MemoryDB = {
		user: [],
		session: [],
		account: [],
		verification: [],
	};
	const auth = createAuth({
		env: { ...defaultTestEnvironment, ...overrides },
		database: memoryAdapter(database),
	});

	return {
		handler: auth.handler,
		enabledProviders: auth.enabledProviders,
		users: () => database.user ?? [],
		accounts: () => database.account ?? [],
	};
}
