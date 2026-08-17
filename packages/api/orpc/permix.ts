import { ORPCError } from "@orpc/server";
import type { PermissionsDefinition } from "@startkiter/permissions";
import { createPermix } from "permix/orpc";

export const permix = createPermix<PermissionsDefinition>({
	onForbidden: () => {
		throw new ORPCError("FORBIDDEN");
	},
}).contextKey("permissions");
