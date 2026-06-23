import { createCookieSessionStorage } from "@remix-run/node";

/**
 * Signed, HTTP-only cookie session. The session secret comes from env; in dev a
 * fallback keeps the app runnable, but production must set SESSION_SECRET.
 */
const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-me";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__cd_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
