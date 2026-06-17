let _accessToken: string | null = null;
let _expiresAt: number | null = null;

export const tokenStore = {
  set(token: string, expiresInSeconds: number): void {
    _accessToken = token;
    _expiresAt = Date.now() + expiresInSeconds * 1000;
  },

  get(): string | null {
    if (!_accessToken || !_expiresAt) return null;
    if (Date.now() >= _expiresAt) {
      _accessToken = null;
      _expiresAt = null;
      return null;
    }
    return _accessToken;
  },

  clear(): void {
    _accessToken = null;
    _expiresAt = null;
  },

  isAuthenticated(): boolean {
    return tokenStore.get() !== null;
  },
};
