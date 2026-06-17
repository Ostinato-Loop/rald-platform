import crypto from "node:crypto";

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

function getSecret(): string {
  const secret = process.env["RALD_JWT_SECRET"];
  if (!secret) throw new Error("RALD_JWT_SECRET environment variable is required");
  return secret;
}

export function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresInSeconds = 3600,
): string {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(fullPayload));
  const signingInput = `${header}.${body}`;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${sig}`;
}

export function verifyJwt(token: string): JwtPayload {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const [header, body, sig] = parts as [string, string, string];
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(sig, "base64url"),
      Buffer.from(expectedSig, "base64url"),
    )
  ) {
    throw new Error("Invalid JWT signature");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as JwtPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("JWT has expired");

  return payload;
}
