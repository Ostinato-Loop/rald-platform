import { useState, useCallback } from "react";

let _baseUrl = "/api";

export function setALIABaseUrl(url: string): void {
  _baseUrl = url.replace(/\/+$/, "");
}

export interface AliasResolution {
  walletId: string | null;
  username: string;
  raldEmail: string | null;
  trustScore: number;
  kycTier: number;
}

export interface AliasResolveResult {
  alias: string;
  aliasType: string;
  resolvedTo: AliasResolution;
}

export interface UseALIAResolveReturn {
  resolve: (alias: string) => Promise<AliasResolveResult>;
  data: AliasResolveResult | null;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useALIAResolve(): UseALIAResolveReturn {
  const [data, setData] = useState<AliasResolveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async (alias: string): Promise<AliasResolveResult> => {
    setLoading(true);
    setError(null);
    try {
      const encoded = encodeURIComponent(alias.trim().toLowerCase());
      const res = await fetch(`${_baseUrl}/alia/resolve/${encoded}`);
      const body = await res.json();

      if (!res.ok) {
        const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
        throw Object.assign(new Error(msg), { status: res.status, data: body });
      }

      setData(body as AliasResolveResult);
      return body as AliasResolveResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { resolve, data, loading, error, reset };
}
