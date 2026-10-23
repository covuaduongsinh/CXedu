import { Hono } from "hono";
import { cors } from "hono/cors";
import { createNodeWebSocket } from "@hono/node-ws";

import { auth } from "./auth";
import { pool } from "./db";
import { env } from "./env";
import { realtimeHandlers } from "./realtime";
import { mintAccessToken } from "./token";

export const app = new Hono();
export const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app,
});

const allowedOrigin = (origin: string) =>
  env.trustedOrigins.includes(origin) ? origin : null;

app.use(
  "*",
  cors({
    origin: allowedOrigin,
    credentials: true,
    allowMethods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Prefer",
      "Range",
      "Accept-Profile",
      "Content-Profile",
    ],
    exposeHeaders: ["set-auth-token", "Content-Range"],
    maxAge: 86_400,
  }),
);

app.get("/health", async (c) => {
  await pool.query("select 1");
  return c.json({ ok: true, service: "cx-api" });
});

/** Đổi phiên Better Auth (cookie hoặc Bearer) lấy JWT ngắn hạn cho dữ liệu và realtime. */
app.get("/auth/token", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Chưa đăng nhập" }, 401);
  const { accessToken, expiresAt } = await mintAccessToken(session.user);
  return c.json({
    accessToken,
    expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  });
});

app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));

const HOP_BY_HOP = [
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
];

/** Cổng dữ liệu: chuyển tiếp tới PostgREST nội bộ; PostgREST tự kiểm JWT và áp RLS. */
app.all("/rest/v1/*", async (c) => {
  const incoming = new URL(c.req.url);
  const target = new URL(
    incoming.pathname.replace(/^\/rest\/v1/u, "") || "/",
    env.postgrestUrl,
  );
  target.search = incoming.search;
  const headers = new Headers(c.req.raw.headers);
  for (const name of HOP_BY_HOP) headers.delete(name);
  headers.delete("cookie");
  const hasBody = !["GET", "HEAD"].includes(c.req.method);
  const upstream = await fetch(target, {
    method: c.req.method,
    headers,
    body: hasBody ? await c.req.arrayBuffer() : undefined,
  });
  const responseHeaders = new Headers(upstream.headers);
  for (const name of [...HOP_BY_HOP, "content-encoding"])
    responseHeaders.delete(name);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
});

app.get(
  "/realtime",
  upgradeWebSocket((c) => realtimeHandlers(c.req.query("token"))),
);
