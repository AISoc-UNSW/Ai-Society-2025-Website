"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import { User } from "@/lib/types";

interface UserProviderProps {
  children: React.ReactNode;
  initialUser?: User;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const initialize = useUserStore(state => state.initialize);

  useEffect(() => {
    initialize(initialUser);
  }, [initialize, initialUser]);

  return <>{children}</>;
}
