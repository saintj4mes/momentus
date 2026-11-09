import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

const cookieName = "momentus-local-demo";
const sessionSeconds = 8 * 60 * 60;

function localDemoConfig() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.MOMENTUS_LOCAL_DEMO_ENABLED !== "true"
  ) {
    return null;
  }
  const email = process.env.MOMENTUS_LOCAL_DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.MOMENTUS_LOCAL_DEMO_PASSWORD;
  const secret = process.env.MOMENTUS_LOCAL_DEMO_SIGNING_SECRET;
  if (!email || !password || !secret || secret.length < 32) return null;
  return { email, password, secret };
}

export function isLocalDemoEnabled() {
  return localDemoConfig() !== null;
}

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return (
    leftBytes.length === rightBytes.length &&
    timingSafeEqual(leftBytes, rightBytes)
  );
}

export function localDemoCredentialsMatch(email: string, password: string) {
  const config = localDemoConfig();
  if (!config) return false;
  return (
    safeEqual(email.trim().toLowerCase(), config.email) &&
    safeEqual(password, config.password)
  );
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function createLocalDemoSession() {
  const config = localDemoConfig();
  if (!config) throw new Error("Local demo authentication is disabled.");
  const expiresAt = Math.floor(Date.now() / 1000) + sessionSeconds;
  const payload = `${config.email}|${expiresAt}`;
  const value = `${Buffer.from(payload).toString("base64url")}.${signature(payload, config.secret)}`;
  const cookieStore = await cookies();
  cookieStore.set(cookieName, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionSeconds,
  });
}

export async function getLocalDemoSession(options: { requestTime?: boolean } = {}) {
  const config = localDemoConfig();
  if (!config) return null;
  if (options.requestTime !== false) await connection();
  const value = (await cookies()).get(cookieName)?.value;
  if (!value) return null;
  const [encodedPayload, suppliedSignature, extra] = value.split(".");
  if (!encodedPayload || !suppliedSignature || extra) return null;
  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!safeEqual(signature(payload, config.secret), suppliedSignature))
    return null;
  const [email, expiry, extraPayload] = payload.split("|");
  if (
    extraPayload ||
    !email ||
    !safeEqual(email, config.email) ||
    !/^\d+$/.test(expiry ?? "") ||
    Number(expiry) <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }
  return { email };
}

export async function clearLocalDemoSession() {
  (await cookies()).delete(cookieName);
}
