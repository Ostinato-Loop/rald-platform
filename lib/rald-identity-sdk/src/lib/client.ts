import { tokenStore } from "./tokenStore";

let _baseUrl = "/api";

export function setIdentityBaseUrl(url: string): void {
  _baseUrl = url.replace(/\/+$/, "");
}

export interface SignupInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  username?: string;
  displayName?: string;
}

export interface ActivateProductInput {
  product: string;
}

export interface RALDIdentity {
  id: string;
  username: string;
  email: string;
  raldEmail: string | null;
  aliasHandle: string | null;
  walletId: string | null;
  trustScore: number;
  kycTier: number;
  activatedProducts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: RALDIdentity;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = tokenStore.get();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${_baseUrl}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(
      new Error((body as { error?: string }).error ?? `HTTP ${res.status}`),
      { status: res.status, data: body },
    );
  }

  return res.json() as Promise<T>;
}

export const identityClient = {
  async signup(input: SignupInput): Promise<AuthResponse> {
    return request<AuthResponse>("/identity/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    return request<AuthResponse>("/identity/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getProfile(): Promise<RALDIdentity> {
    return request<RALDIdentity>("/identity/profile");
  },

  async updateProfile(input: UpdateProfileInput): Promise<RALDIdentity> {
    return request<RALDIdentity>("/identity/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async activateProduct(input: ActivateProductInput): Promise<{ activatedProducts: string[] }> {
    return request<{ activatedProducts: string[] }>("/identity/activate-product", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
