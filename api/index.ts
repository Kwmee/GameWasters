import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server";

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!appPromise) {
    appPromise = createApp();
  }

  // Mantiene las rutas `/api/*` originales cuando Vercel reescribe hacia `/api/index`.
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
  return app(req as any, res as any);
}
