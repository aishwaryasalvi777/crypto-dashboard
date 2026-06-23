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

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const submitting = navigation.state === "submitting";

  return (
    <main className="auth">
      <div className="auth__card">
        <div className="auth__brand">
          <div className="brand__mark">◆</div>
          <div>
            <div className="auth__title">Tessera</div>
            <div className="brand__sub">Crypto Dashboard</div>
          </div>
        </div>

        {actionData?.error ? <div className="auth__error">{actionData.error}</div> : null}

        <Form method="post">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="field">
            <label className="field__label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              className="field__input"
              autoComplete="username"
              defaultValue=""
              required
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="field__input"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="auth__submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </Form>

        <p className="auth__hint">
          Demo credentials come from your <code>.env</code> (defaults: admin / password).
        </p>
      </div>
    </main>
  );
}
