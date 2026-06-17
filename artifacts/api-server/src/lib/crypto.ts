import crypto from "node:crypto";

const RALD_ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const RALD_ID_LENGTH = 10;

export function generateRaldId(): string {
  const bytes = crypto.randomBytes(RALD_ID_LENGTH);
  let id = "rld_";
  for (let i = 0; i < RALD_ID_LENGTH; i++) {
    id += RALD_ID_CHARS[bytes[i]! % RALD_ID_CHARS.length];
  }
  return id;
}

export function buildWalletId(raldId: string): string {
  return `wallet_${raldId}`;
}

export function buildAliasHandle(username: string): string {
  return `${username}@rald`;
}

export function buildRaldEmail(username: string): string {
  return `${username}@rald.cloud`;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise<string>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return new Promise<boolean>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      const candidate = derivedKey.toString("hex");
      resolve(crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex")));
    });
  });
}
