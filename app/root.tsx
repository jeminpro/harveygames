import { useEffect, type ReactNode } from "react";
import outfit400 from "@fontsource/outfit/400.css?url";
import outfit500 from "@fontsource/outfit/500.css?url";
import outfit600 from "@fontsource/outfit/600.css?url";
import outfit700 from "@fontsource/outfit/700.css?url";
import syne700 from "@fontsource/syne/700.css?url";
import syne800 from "@fontsource/syne/800.css?url";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { SiteHeader } from "./components/site-header";
import { seedCatalog } from "./db/client";
import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    href: `${import.meta.env.BASE_URL.replace(/\/?$/, "/")}logo.png`,
    type: "image/png",
  },
  { rel: "stylesheet", href: syne700 },
  { rel: "stylesheet", href: syne800 },
  { rel: "stylesheet", href: outfit400 },
  { rel: "stylesheet", href: outfit500 },
  { rel: "stylesheet", href: outfit600 },
  { rel: "stylesheet", href: outfit700 },
  { rel: "stylesheet", href: stylesheet },
];

export function meta() {
  return [
    { title: "Harvey Games" },
    {
      name: "description",
      content: "A local cabinet of games that stays in this browser.",
    },
  ];
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#07080d" />
        <Meta />
        <Links />
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
  useEffect(() => {
    seedCatalog().catch((error: unknown) => {
      console.error("Could not open the local game library", error);
    });
  }, []);

  return (
    <>
      <SiteHeader />
      <Outlet />
    </>
  );
}

export function HydrateFallback() {
  return (
    <>
      <SiteHeader />
      <main className="library">
        <div className="library-intro">
          <p className="eyebrow">Harvey Games</p>
          <h1>Opening the cabinet.</h1>
        </div>
      </main>
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message = isRouteErrorResponse(error)
    ? error.status === 404
      ? "That page is not in the cabinet."
      : error.statusText
    : "Something broke in the cabinet.";

  return (
    <main className="missing">
      <p className="eyebrow">Error</p>
      <h1>{message}</h1>
    </main>
  );
}
