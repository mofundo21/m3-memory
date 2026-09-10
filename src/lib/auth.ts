import "server-only";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const cookieName = "m3_memory_session";

function secret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET_REQUIRED");
  return "local-development-secret";
}

function digest(value: string) {
  return createHash("sha256").update(`${value}:${secret()}`).digest("hex");
}

function expectedPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV === "production") return null;
  return "change-this-local-password";
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  return jar.get(cookieName)?.value === digest("admin");
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("UNAUTHENTICATED");
  }
}

export async function login(password: string) {
  const expected = expectedPassword();
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);

  if (!ok) return false;

  const jar = await cookies();
  jar.set(cookieName, digest("admin"), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return true;
}

export async function logout() {
  const jar = await cookies();
  jar.delete(cookieName);
}

