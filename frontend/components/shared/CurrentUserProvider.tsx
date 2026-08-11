"use client";

import { createContext, useContext } from "react";
import type { CurrentUser } from "@/types/api";

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: CurrentUser | null;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser(): CurrentUser | null {
  return useContext(CurrentUserContext);
}

export function useRequiredUser(): CurrentUser {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error("useRequiredUser must be used within an authenticated layout");
  return user;
}
