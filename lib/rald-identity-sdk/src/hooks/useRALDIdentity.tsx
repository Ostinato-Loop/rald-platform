import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { identityClient, type RALDIdentity, type UpdateProfileInput, type ActivateProductInput } from "../lib/client";
import { tokenStore } from "../lib/tokenStore";

const IDENTITY_QUERY_KEY = ["rald", "identity"] as const;

export interface UseRALDIdentityReturn {
  identity: RALDIdentity | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  updateProfile: (input: UpdateProfileInput) => Promise<RALDIdentity>;
  activateProduct: (product: string) => Promise<string[]>;
}

export function useRALDIdentity(): UseRALDIdentityReturn {
  const qc = useQueryClient();

  const {
    data: identity = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: IDENTITY_QUERY_KEY,
    queryFn: () => identityClient.getProfile(),
    enabled: tokenStore.isAuthenticated(),
    staleTime: 60_000,
    retry: (failureCount, err) => {
      if ((err as { status?: number }).status === 401) return false;
      return failureCount < 2;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => identityClient.updateProfile(input),
    onSuccess: (updated) => {
      qc.setQueryData(IDENTITY_QUERY_KEY, updated);
    },
  });

  const activateMutation = useMutation({
    mutationFn: (input: ActivateProductInput) => identityClient.activateProduct(input),
    onSuccess: ({ activatedProducts }) => {
      qc.setQueryData<RALDIdentity>(IDENTITY_QUERY_KEY, (prev) =>
        prev ? { ...prev, activatedProducts } : prev,
      );
    },
  });

  const updateProfile = useCallback(
    (input: UpdateProfileInput) => updateMutation.mutateAsync(input),
    [updateMutation],
  );

  const activateProduct = useCallback(
    (product: string) =>
      activateMutation
        .mutateAsync({ product } as ActivateProductInput)
        .then((r) => r.activatedProducts),
    [activateMutation],
  );

  return {
    identity,
    isLoading,
    error: error as Error | null,
    refetch: () => void refetch(),
    updateProfile,
    activateProduct,
  };
}
