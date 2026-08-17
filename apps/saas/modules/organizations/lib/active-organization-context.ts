import type { ActiveOrganization } from "@startkiter/auth";
import React from "react";

export const ActiveOrganizationContext = React.createContext<
	| {
			activeOrganization: ActiveOrganization | null;
			activeOrganizationUserRole: ActiveOrganization["members"][number]["role"] | null;
			loaded: boolean;
			setActiveOrganization: (organizationId: string | null) => Promise<void>;
			refetchActiveOrganization: () => Promise<void>;
	  }
	| undefined
>(undefined);
