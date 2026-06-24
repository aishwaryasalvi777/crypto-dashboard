import { redirect } from "@remix-run/node";

import { commitSession, destroySession, getSession } from "./session.server";

const USER_SESSION_KEY = "userId";

/**
 * Verify credentials against the env-configured pair. This is the deliberate take-home
 * stand-in for a real identity provider — swap the body for a user store + password hash
 * comparison without changing the session plumbing or route guards (see CLAUDE.md §Auth).
 *
 * Uses a length-aware constant-ish comparison to avoid trivially leaking via timing.
 */
export function verifyCredentials(username: string, password: string): boolean {
  const { user, pass } = expectedCredentials();
  return safeEqual(username, user) && safeEqual(password, pass);
}

/**
 * Resolve the expected credentials. In production we **fail closed**: if the env vars aren't set we
 * throw rather than silently accepting the well-known dev defaults — a forgotten env var must never
 * ship working `admin`/`password` login. In development the defaults are a convenience.
 */
function expectedCredentials(): { user: string; pass: string } {
  const user = process.env.AUTH_USERNAME;
  const pass = process.env.AUTH_PASSWORD;
  if (process.env.NODE_ENV === "production") {
    if (!user || !pass) {
      throw new Error(
        "AUTH_USERNAME and AUTH_PASSWORD must be set in production (refusing to use defaults).",
      );
    }
    return { user, pass };
  }
  return { user: user || "admin", pass: pass || "password" };
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Create a session for the user and redirect to `redirectTo`. */
export async function createUserSession(request: Request, userId: string, redirectTo: string) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set(USER_SESSION_KEY, userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

/** Return the logged-in user id, or null. */
export async function getUserId(request: Request): Promise<string | null> {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get(USER_SESSION_KEY);
  return typeof userId === "string" ? userId : null;
}

/** Route guard: returns the user id or redirects to /login (preserving intended destination). */
export async function requireUserId(request: Request): Promise<string> {
  const userId = await getUserId(request);
  if (!userId) {
    const url = new URL(request.url);
    const params = new URLSearchParams({ redirectTo: url.pathname + url.search });
    throw redirect(`/login?${params}`);
  }
  return userId;
}

/** Destroy the session and redirect to /login. */
export async function logout(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await destroySession(session) },
  });
}
