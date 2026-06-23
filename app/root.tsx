import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";

import { themeBootstrapScript } from "~/lib/theme";
import appStylesHref from "~/styles/app.css?url";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
  },
  { rel: "stylesheet", href: appStylesHref },
];

export const meta: MetaFunction = () => [
  { title: "Tessera — Crypto Dashboard" },
  { name: "description", content: "Real-time cryptocurrency dashboard built with Remix." },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Apply persisted theme before first paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "An unexpected error occurred.";
  return (
    <main className="auth">
      <div className="auth__card" style={{ textAlign: "center" }}>
        <div className="state__title">Something went wrong</div>
        <p className="state__msg">{message}</p>
      </div>
    </main>
  );
}
