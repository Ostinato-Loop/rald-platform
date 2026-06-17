import { useState, useCallback, useEffect } from "react";
import { tokenStore } from "../lib/tokenStore";

let _baseUrl = "/api";

export function setWalletBaseUrl(url: string): void {
  _baseUrl = url.replace(/\/+$/, "");
}

export interface RALDWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: "active" | "frozen" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface RALDTransaction {
  id: string;
  walletId: string;
  type: "credit" | "debit" | "transfer_in" | "transfer_out";
  amount: number;
  currency: string;
  reference: string;
  description: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  status: "completed" | "failed" | "pending";
  createdAt: string;
}

export interface CreditInput {
  amount: number;
  currency?: string;
  reference?: string;
  description?: string;
}

export interface DebitInput {
  amount: number;
  currency?: string;
  reference?: string;
  description?: string;
}

export interface TransferInput {
  to: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface UseRALDWalletReturn {
  wallet: RALDWallet | null;
  transactions: RALDTransaction[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  credit: (input: CreditInput) => Promise<{ balance: number; transaction: RALDTransaction }>;
  debit: (input: DebitInput) => Promise<{ balance: number; transaction: RALDTransaction }>;
  transfer: (input: TransferInput) => Promise<{ senderBalance: number; transaction: RALDTransaction; to: string }>;
}

async function walletRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${_baseUrl}${path}`, { ...options, headers });
  const body = await res.json();
  if (!res.ok) {
    throw Object.assign(
      new Error((body as { error?: string }).error ?? `HTTP ${res.status}`),
      { status: res.status, data: body },
    );
  }
  return body as T;
}

export function useRALDWallet(): UseRALDWalletReturn {
  const [wallet, setWallet] = useState<RALDWallet | null>(null);
  const [transactions, setTransactions] = useState<RALDTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, t] = await Promise.all([
        walletRequest<RALDWallet>("/wallet"),
        walletRequest<{ transactions: RALDTransaction[] }>("/wallet/transactions"),
      ]);
      setWallet(w);
      setTransactions(t.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenStore.get()) refresh();
  }, [refresh]);

  const credit = useCallback(async (input: CreditInput) => {
    const result = await walletRequest<{ balance: number; transaction: RALDTransaction }>(
      "/wallet/credit",
      { method: "POST", body: JSON.stringify(input) },
    );
    setWallet((w) => (w ? { ...w, balance: result.balance } : w));
    setTransactions((t) => [result.transaction, ...t]);
    return result;
  }, []);

  const debit = useCallback(async (input: DebitInput) => {
    const result = await walletRequest<{ balance: number; transaction: RALDTransaction }>(
      "/wallet/debit",
      { method: "POST", body: JSON.stringify(input) },
    );
    setWallet((w) => (w ? { ...w, balance: result.balance } : w));
    setTransactions((t) => [result.transaction, ...t]);
    return result;
  }, []);

  const transfer = useCallback(async (input: TransferInput) => {
    const result = await walletRequest<{
      senderBalance: number;
      transaction: RALDTransaction;
      to: string;
    }>("/wallet/transfer", { method: "POST", body: JSON.stringify(input) });
    setWallet((w) => (w ? { ...w, balance: result.senderBalance } : w));
    setTransactions((t) => [result.transaction, ...t]);
    return result;
  }, []);

  return { wallet, transactions, loading, error, refresh, credit, debit, transfer };
}
