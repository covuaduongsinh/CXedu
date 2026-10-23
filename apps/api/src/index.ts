import { serve } from "@hono/node-server";

import { app, injectWebSocket } from "./app";
import { env } from "./env";
import { startJobs } from "./jobs";
import { startChangeListener } from "./realtime";

const listener = await startChangeListener();
const boss = env.runJobs ? await startJobs() : null;

const server = serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`CX API đang chạy tại http://localhost:${info.port}`);
});
injectWebSocket(server);

const shutdown = async () => {
  server.close();
  await Promise.allSettled([listener.end(), boss?.stop({ graceful: true })]);
  process.exit(0);
};
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
