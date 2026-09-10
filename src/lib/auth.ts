import "server-only";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  getAdminAuthMode,
  isSupabaseAdmin,
  supabasePasswordLogin,
  verifySupabaseAdminToken,
  type LoginResult
} from "./supabase";

const localCookieName = "m3_memory_session";
const supabaseCookieName = "m3_memory_admin_token";

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

export { getAdminAuthMode };

function isLocalAdminCookie(value?: string) {
  return value === digest("admin");
}

export async function getAdminToken() {
  if (getAdminAuthMode() === "local") return null;
  const jar = await cookies();
  const token = jar.get(supabaseCookieName)?.value;
  if (!token) return null;
  const session = await verifySupabaseAdminToken(token).catch(() => null);
  return session?.accessToken || null;
}

export async function isAdminAuthenticated() {
  const jar = await cookies();

  if (getAdminAuthMode() === "local") {
    return isLocalAdminCookie(jar.get(localCookieName)?.value);
  }

  const token = jar.get(supabaseCookieName)?.value;
  if (!token) return false;
  return Boolean(await verifySupabaseAdminToken(token).catch(() => null));
}

export async function requireAdmin() {
  if (getAdminAuthMode() === "local") {
    if (!(await isAdminAuthenticated())) throw new Error("UNAUTHENTICATED");
    return null;
  }

  const token = await getAdminToken();
  if (!token) throw new Error("UNAUTHENTICATED");
  return token;
}

export async function login(emailOrPassword: string, maybePassword?: string): Promise<LoginResult> {
  const jar = await cookies();

  if (getAdminAuthMode() === "local") {
    const expected = expectedPassword();
    if (!expected) return "invalid";

    const a = Buffer.from(maybePassword ?? emailOrPassword);
    const b = Buffer.from(expected);
    const ok = a.length === b.length && timingSafeEqual(a, b);

    if (!ok) return "invalid";

    jar.set(localCookieName, digest("admin"), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2
    });
    return "ok";
  }

  const existingToken = jar.get(supabaseCookieName)?.value;
  if (existingToken && !(await verifySupabaseAdminToken(existingToken).catch(() => null))) {
    jar.delete(supabaseCookieName);
    return "expired";
  }

  const session = await supabasePasswordLogin(emailOrPassword, maybePassword || "");
  if (!session) return "invalid";
  if (!(await isSupabaseAdmin(session.accessToken))) return "unauthorized";

  jar.set(supabaseCookieName, session.accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60
  });
  return "ok";
}

export async function logout() {
  const jar = await cookies();
  jar.delete(localCookieName);
  jar.delete(supabaseCookieName);
}


