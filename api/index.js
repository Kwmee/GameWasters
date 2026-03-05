import { createApp } from "./server.js";

let appPromise = null;

export default async function handler(req, res) {
  if (!appPromise) {
    appPromise = createApp();
  }

  // Keep original `/api/*` paths when Vercel rewrites to `/api/index`.
  if (typeof req.url === "string") {
    const parsed = new URL(req.url, "http://localhost");
    const rewrittenPath = parsed.searchParams.get("__path");
    if (rewrittenPath && parsed.pathname === "/api/index") {
      parsed.searchParams.delete("__path");
      const query = parsed.searchParams.toString();
      req.url = `/api/${rewrittenPath}${query ? `?${query}` : ""}`;
    }
  }

  const app = await appPromise;
  return app(req, res);
}
