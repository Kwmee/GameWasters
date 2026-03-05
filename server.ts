import { createApp, startServer } from "./api/server.js";

export { createApp, startServer };

if (!process.env.VERCEL) {
  startServer();
}
