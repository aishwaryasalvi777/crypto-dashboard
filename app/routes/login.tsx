import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, useSearchParams } from "@remix-run/react";

import { createUserSession, getUserId, verifyCredentials } from "~/lib/auth/auth.server";

export const meta: MetaFunction = () => [{ title: "Sign in — Tessera" }];

export async function loader({ request }: LoaderFunctionArgs) {
  // Already signed in? Skip the form.
  if (await getUserId(request)) return redirect("/dashboard");
  return json({});
}

function safeRedirect(to: FormDataEntryValue | null): string {
  if (typeof to === "string" && to.startsWith("/") && !to.startsWith("//")) return to;
  return "/dashboard";
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const redirectTo = safeRedirect(form.get("redirectTo"));

  if (!verifyCredentials(username, password)) {
    return json({ error: "Invalid username or password." }, { status: 401 });
  }
  return createUserSession(request, username, redirectTo);
}

const TICKERS = [
  { symbol: "BTC", price: "$64,250", chg: "+1.8%", pos: true },
  { symbol: "ETH", price: "$3,420", chg: "+2.4%", pos: true },
  { symbol: "SOL", price: "$142.50", chg: "-1.2%", pos: false },
  { symbol: "XRP", price: "$0.523", chg: "+0.6%", pos: true },
  { symbol: "ADA", price: "$0.452", chg: "-0.8%", pos: false },
  { symbol: "DOGE", price: "$0.123", chg: "+3.1%", pos: true },
  { symbol: "AVAX", price: "$36.80", chg: "-2.1%", pos: false },
  { symbol: "LINK", price: "$14.25", chg: "+1.1%", pos: true },
  { symbol: "DOT", price: "$6.42", chg: "-0.4%", pos: false },
  { symbol: "LTC", price: "$84.30", chg: "+0.9%", pos: true },
];

const tickerItems = [...TICKERS, ...TICKERS];

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const submitting = navigation.state === "submitting";

  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  return (
    <main className="lo2-root">
      {/* Animated backdrop */}
      <div className="lo2-backdrop">
        <div className="lo2-aurora lo2-aurora--1" />
        <div className="lo2-aurora lo2-aurora--2" />
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="lo2-chart-svg">
          <defs>
            <linearGradient id="lo2fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,230 C120,200 200,250 320,210 C440,170 520,120 640,150 C760,180 840,90 960,110 C1080,130 1160,60 1280,90 C1360,110 1410,80 1440,70 L1440,320 L0,320 Z"
            fill="url(#lo2fill)"
          />
          <path
            d="M0,230 C120,200 200,250 320,210 C440,170 520,120 640,150 C760,180 840,90 960,110 C1080,130 1160,60 1280,90 C1360,110 1410,80 1440,70"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeOpacity="0.55"
            strokeDasharray="2600"
            strokeDashoffset="2600"
            className="lo2-chart-line"
          />
        </svg>
        <div className="lo2-grid" />
      </div>

      {/* Ticker strip */}
      <div className="lo2-ticker">
        <div className="lo2-ticker__track">
          {tickerItems.map((t, i) => (
            <span key={i} className="lo2-ticker__item">
              <span className="lo2-ticker__symbol">{t.symbol}</span>
              {t.price}
              <span style={{ color: t.pos ? "#16a34a" : "#ef4444" }}>{t.chg}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="lo2-card">
        <div className="lo2-brand">
          <div className="lo2-brand__mark">◈</div>
          <div className="lo2-brand__text">
            <div className="lo2-brand__name">Tessera</div>
            <div className="lo2-brand__sub">Crypto Dashboard</div>
          </div>
        </div>

        {actionData?.error ? <div className="auth__error">{actionData.error}</div> : null}

        <Form method="post">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <label className="lo2-label" htmlFor="username">Username</label>
          <div className="lo2-field">
            <span className="lo2-field__icon">◐</span>
            <input
              id="username"
              name="username"
              className="lo2-input"
              autoComplete="username"
              placeholder="Enter your username"
              required
            />
          </div>

          <label className="lo2-label" htmlFor="password">Password</label>
          <div className="lo2-field">
            <span className="lo2-field__icon">⚷</span>
            <input
              id="password"
              name="password"
              type={showPass ? "text" : "password"}
              className="lo2-input lo2-input--pass"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="lo2-toggle-pass"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? "🙈" : "👁"}
            </button>
          </div>

          <div className="lo2-row">
            <button
              type="button"
              className="lo2-remember"
              onClick={() => setRemember((v) => !v)}
            >
              <span
                className="lo2-remember__box"
                style={{
                  background: remember ? "#3b82f6" : "transparent",
                  borderColor: remember ? "#3b82f6" : "#5a6478",
                }}
              >
                {remember ? "✓" : ""}
              </span>
              Remember me
            </button>
          </div>

          <button type="submit" className="lo2-submit" disabled={submitting}>
            <span style={{ position: "relative", zIndex: 1 }}>
              {submitting ? "Signing in…" : "Sign in"}
            </span>
            <span className="lo2-submit__shimmer" aria-hidden="true" />
          </button>
        </Form>

        <div className="lo2-secure">
          <span className="lo2-secure__dot" />
          Secured · end-to-end encrypted
        </div>
      </div>
    </main>
  );
}
