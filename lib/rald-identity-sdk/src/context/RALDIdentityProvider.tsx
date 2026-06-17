import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tokenStore } from "../lib/tokenStore";
import { identityClient, type RALDIdentity } from "../lib/client";
import { setIdentityBaseUrl } from "../lib/client";

interface RALDIdentityContextValue {
  identity: RALDIdentity | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
}

const RALDIdentityContext = createContext<RALDIdentityContextValue | null>(null);

export interface RALDIdentityProviderProps {
  children: ReactNode;
  apiBaseUrl?: string;
  queryClient?: QueryClient;
}

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

function RALDIdentityInner({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<RALDIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => tokenStore.isAuthenticated());

  const refetch = async () => {
    if (!tokenStore.isAuthenticated()) {
      setIdentity(null);
      setIsAuthenticated(false);
      return;
    }
    setIsLoading(true);
    try {
      const profile = await identityClient.getProfile();
      setIdentity(profile);
      setIsAuthenticated(true);
    } catch {
      tokenStore.clear();
      setIdentity(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refetch();
  }, []);

  return (
    <RALDIdentityContext.Provider value={{ identity, isLoading, isAuthenticated, refetch }}>
      {children}
    </RALDIdentityContext.Provider>
  );
}

export function RALDIdentityProvider({
  children,
  apiBaseUrl,
  queryClient = defaultQueryClient,
}: RALDIdentityProviderProps) {
  if (apiBaseUrl) {
    setIdentityBaseUrl(apiBaseUrl);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RALDIdentityInner>{children}</RALDIdentityInner>
    </QueryClientProvider>
  );
}

export function useRALDIdentityContext(): RALDIdentityContextValue {
  const ctx = useContext(RALDIdentityContext);
  if (!ctx) {
    throw new Error("useRALDIdentityContext must be used inside <RALDIdentityProvider>");
  }
  return ctx;
}
