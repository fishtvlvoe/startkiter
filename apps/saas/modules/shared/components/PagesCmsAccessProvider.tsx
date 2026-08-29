"use client";

import { createContext, type ReactNode, useContext } from "react";

const PagesCmsAccessContext = createContext(false);

export function PagesCmsAccessProvider({
	canAccessPagesCms,
	children,
}: {
	canAccessPagesCms: boolean;
	children: ReactNode;
}) {
	return (
		<PagesCmsAccessContext.Provider value={canAccessPagesCms}>{children}</PagesCmsAccessContext.Provider>
	);
}

export function useCanAccessPagesCmsAdmin(): boolean {
	return useContext(PagesCmsAccessContext);
}
