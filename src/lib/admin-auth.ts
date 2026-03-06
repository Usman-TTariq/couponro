const COOKIE_NAME = "admin_session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const secret =
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV === "development" ? "admin123" : "");
  if (!secret) throw new Error("ADMIN_PASSWORD is not set");
  return secret;
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function verifySignature(
  secret: string,
  message: string,
  signature: string
): Promise<boolean> {
  const expected = await hmacSha256(secret, message);
  return signature === expected && signature.length > 0;
}

export async function createSession(): Promise<string> {
  const secret = getSecret();
  const timestamp = String(Date.now());
  const signature = await hmacSha256(secret, "admin_session:" + timestamp);
  return `${timestamp}.${signature}`;
}

export async function verifySession(
  cookieValue: string | undefined
): Promise<boolean> {
  if (!cookieValue || !cookieValue.includes(".")) return false;
  try {
    const secret =
      process.env.ADMIN_PASSWORD ??
      (process.env.NODE_ENV === "development" ? "admin123" : "");
    if (!secret) return false;
    const [timestamp, signature] = cookieValue.split(".");
    if (!timestamp || !signature) return false;
    const ts = parseInt(timestamp, 10);
    if (Number.isNaN(ts)) return false;
    if (Date.now() - ts > MAX_AGE_MS) return false;
    return await verifySignature(
      secret,
      "admin_session:" + timestamp,
      signature
    );
  } catch {
    return false;
  }
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 24 * 60 * 60,
  };
}
