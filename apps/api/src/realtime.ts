import pg from "pg";
import type { WSContext } from "hono/ws";

import { pool } from "./db";
import { env } from "./env";
import { verifyAccessToken } from "./token";

export interface ChangeEvent {
  table: string;
  op: "insert" | "update" | "delete";
  org_id: string | null;
  center_id: string | null;
  id: string | null;
}

export interface Subscription {
  orgId: string;
  centerId: string;
}

/** Sự kiện thuộc đúng cơ sở, hoặc thuộc tổ chức khi bảng không gắn cơ sở (enrollments, payments). */
export const matchesSubscription = (
  event: ChangeEvent,
  subscription: Subscription,
) =>
  event.center_id
    ? event.center_id === subscription.centerId
    : event.org_id === subscription.orgId;

interface Client {
  socket: WSContext;
  userId: string;
  subscriptions: Map<string, Subscription>;
}

const clients = new Set<Client>();

const send = (socket: WSContext, message: unknown) => {
  try {
    socket.send(JSON.stringify(message));
  } catch {
    // Kết nối đã đóng; dọn ở onClose.
  }
};

/** Người dùng có quyền xem cơ sở này không (cùng quy tắc với can_access_center). */
const resolveCenter = async (userId: string, centerId: string) => {
  const { rows } = await pool.query<{ org_id: string }>(
    `select c.org_id from public.centers c
       join public.memberships m on m.org_id = c.org_id and m.user_id = $1
      where c.id = $2 and (m.center_ids is null or c.id = any (m.center_ids))`,
    [userId, centerId],
  );
  return rows[0]?.org_id ?? null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

export const realtimeHandlers = (token: string | undefined) => {
  let client: Client | null = null;
  return {
    async onOpen(_event: Event, socket: WSContext) {
      try {
        const claims = await verifyAccessToken(token ?? "");
        client = { socket, userId: claims.sub, subscriptions: new Map() };
        clients.add(client);
        send(socket, { type: "ready" });
      } catch {
        send(socket, {
          type: "error",
          message: "Phiên đăng nhập không hợp lệ",
        });
        socket.close(4401, "unauthorized");
      }
    },
    async onMessage(event: MessageEvent, socket: WSContext) {
      if (!client) return;
      let message: { type?: string; centerId?: string };
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (message.type === "ping") return send(socket, { type: "pong" });
      if (message.type === "unsubscribe" && message.centerId) {
        client.subscriptions.delete(message.centerId);
        return;
      }
      if (
        message.type !== "subscribe" ||
        !message.centerId ||
        !UUID.test(message.centerId)
      )
        return;
      const orgId = await resolveCenter(client.userId, message.centerId);
      if (!orgId)
        return send(socket, {
          type: "error",
          centerId: message.centerId,
          message: "Không có quyền",
        });
      client.subscriptions.set(message.centerId, {
        orgId,
        centerId: message.centerId,
      });
      send(socket, { type: "subscribed", centerId: message.centerId });
    },
    onClose() {
      if (client) clients.delete(client);
    },
  };
};

/** Một kết nối riêng LISTEN `cx_change`, phát lại cho các client đang theo dõi. */
export const startChangeListener = async () => {
  const listener = new pg.Client({ connectionString: env.databaseUrl });
  await listener.connect();
  listener.on("notification", (notification) => {
    if (notification.channel !== "cx_change" || !notification.payload) return;
    const event = JSON.parse(notification.payload) as ChangeEvent;
    for (const client of clients) {
      for (const subscription of client.subscriptions.values()) {
        if (matchesSubscription(event, subscription)) {
          send(client.socket, {
            type: "change",
            centerId: subscription.centerId,
            table: event.table,
            op: event.op,
          });
        }
      }
    }
  });
  await listener.query("listen cx_change");
  return listener;
};
