let appPromise = null;
let createAppPromise = null;

async function resolveCreateApp() {
  const candidates = ["./server.js", "../server.js", "../server"];
  let lastError = null;

  for (const specifier of candidates) {
    try {
      const mod = await import(specifier);
      if (typeof mod.createApp === "function") {
        return mod.createApp;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No se pudo resolver createApp para la API");
}

export default async function handler(req, res) {
  if (!createAppPromise) {
    createAppPromise = resolveCreateApp();
  }

  if (!appPromise) {
    appPromise = createAppPromise.then((createApp) => createApp());
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
