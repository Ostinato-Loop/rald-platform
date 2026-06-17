import { useState, useCallback } from "react";
import { tokenStore } from "../lib/tokenStore";
import { identityClient, type SignupInput, type LoginInput } from "../lib/client";

export interface UseRALDAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signup: (input: SignupInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

export function useRALDAuth(): UseRALDAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(() => tokenStore.isAuthenticated());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = useCallback(async (input: SignupInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await identityClient.signup(input);
      tokenStore.set(res.token, res.expiresIn);
      setIsAuthenticated(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await identityClient.login(input);
      tokenStore.set(res.token, res.expiresIn);
      setIsAuthenticated(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return { isAuthenticated, isLoading, error, signup, login, logout };
}
