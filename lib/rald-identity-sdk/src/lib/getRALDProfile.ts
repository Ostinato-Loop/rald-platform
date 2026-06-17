import { identityClient, type RALDIdentity } from "./client";
import { tokenStore } from "./tokenStore";

export async function getRALDProfile(): Promise<RALDIdentity | null> {
  if (!tokenStore.isAuthenticated()) return null;
  try {
    return await identityClient.getProfile();
  } catch {
    return null;
  }
}

export async function requireRALDProfile(): Promise<RALDIdentity> {
  const profile = await getRALDProfile();
  if (!profile) throw new Error("Not authenticated — call login() first");
  return profile;
}
