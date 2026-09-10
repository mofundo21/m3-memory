import "server-only";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const cookieName = "m3_memory_session";

function secret() {
  return process.env.SESSION_SECRET || "local-development-secret";
}

function digest(value: string) {
  return createHash("sha256").update(`${value}:${secret()}`).digest("hex");
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
  const expected = process.env.ADMIN_PASSWORD || "change-this-local-password";
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);

  if (!ok) return false;

  const jar = await cookies();
  jar.set(cookieName, digest("admin"), {
    httpOnly: true,
    sameSite: "lax",
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
