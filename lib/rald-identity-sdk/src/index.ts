export { tokenStore } from "./lib/tokenStore";
export { identityClient, setIdentityBaseUrl } from "./lib/client";
export type {
  RALDIdentity,
  AuthResponse,
  SignupInput,
  LoginInput,
  UpdateProfileInput,
  ActivateProductInput,
} from "./lib/client";

export { useRALDAuth } from "./hooks/useRALDAuth";
export type { UseRALDAuthReturn } from "./hooks/useRALDAuth";

export { useRALDIdentity } from "./hooks/useRALDIdentity";
export type { UseRALDIdentityReturn } from "./hooks/useRALDIdentity";

export { getRALDProfile, requireRALDProfile } from "./lib/getRALDProfile";

export {
  RALDIdentityProvider,
  useRALDIdentityContext,
} from "./context/RALDIdentityProvider";
export type { RALDIdentityProviderProps } from "./context/RALDIdentityProvider";

export { useALIAResolve, setALIABaseUrl } from "./hooks/useALIAResolve";
export type {
  AliasResolution,
  AliasResolveResult,
  UseALIAResolveReturn,
} from "./hooks/useALIAResolve";
