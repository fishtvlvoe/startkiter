import { passkeyClient } from "@better-auth/passkey/client";
import {
	adminClient,
	inferAdditionalFields,
	magicLinkClient,
	organizationClient,
	twoFactorClient,
} from "better-auth/client/plugins";
import { adminAc, memberAc, ownerAc } from "better-auth/plugins/organization/access";
import { createAuthClient } from "better-auth/react";

import type { auth } from ".";

export const authClient = createAuthClient({
	plugins: [
		inferAdditionalFields<typeof auth>(),
		magicLinkClient(),
		organizationClient({
			roles: {
				owner: ownerAc,
				admin: adminAc,
				instructor: memberAc,
				user: memberAc,
			},
		}),
		adminClient(),
		passkeyClient(),
		twoFactorClient(),
	],
});

export type AuthClientErrorCodes = typeof authClient.$ERROR_CODES & {
	INVALID_INVITATION: string;
};
