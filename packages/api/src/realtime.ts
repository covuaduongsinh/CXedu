/**
 * Realtime của CX Platform: một WebSocket tới `/realtime`, đăng ký theo cơ sở.
 * Server chỉ gửi tín hiệu "bảng X vừa đổi" để client tải lại dữ liệu (không đẩy nội dung dòng).
 */

export interface ChangeMessage {
  table: string;
  op: "insert" | "update" | "delete";
}

export interface SubscriptionHandlers {
  onChange: (change: ChangeMessage) => void;
  /** Gọi mỗi lần đăng ký thành công (kể cả sau khi kết nối lại) để bắt kịp thay đổi bị lỡ. */
  onSubscribed?: () => void;
}

export interface RealtimeClient {
  subscribe: (centerId: string, handlers: SubscriptionHandlers) => () => void;
}

interface Options {
  url: string;
  getAccessToken: () => Promise<string | null>;
  enabled: boolean;
}

const MAX_BACKOFF_MS = 30_000;

export const createRealtimeClient = ({
  url,
  getAccessToken,
  enabled,
}: Options): RealtimeClient => {
  const subscribers = new Map<string, Set<SubscriptionHandlers>>();
  let socket: WebSocket | null = null;
  let ready = false;
  let attempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const send = (message: unknown) => {
    if (socket && ready) socket.send(JSON.stringify(message));
  };

  const handleMessage = (raw: string) => {
    const message = JSON.parse(raw) as {
      type: string;
      centerId?: string;
      table?: string;
      op?: ChangeMessage["op"];
    };
    if (message.type === "ready") {
      ready = true;
      attempts = 0;
      for (const centerId of subscribers.keys())
        send({ type: "subscribe", centerId });
      return;
    }
    const handlers = message.centerId
      ? subscribers.get(message.centerId)
      : undefined;
    if (!handlers) return;
    if (message.type === "subscribed")
      for (const handler of handlers) handler.onSubscribed?.();
    if (message.type === "change" && message.table && message.op) {
      for (const handler of handlers)
        handler.onChange({ table: message.table, op: message.op });
    }
  };

  const scheduleReconnect = () => {
    if (subscribers.size === 0 || reconnectTimer) return;
    const delay = Math.min(1000 * 2 ** attempts, MAX_BACKOFF_MS);
    attempts += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, delay);
  };

  const disconnect = () => {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
    ready = false;
    const current = socket;
    socket = null;
    current?.close();
  };

  const connect = async () => {
    if (socket || subscribers.size === 0) return;
    const token = await getAccessToken();
    if (!token) return scheduleReconnect();
    const next = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
    socket = next;
    next.onmessage = (event) => handleMessage(String(event.data));
    next.onopen = () => {
      heartbeat = setInterval(() => send({ type: "ping" }), 25_000);
    };
    next.onclose = () => {
      if (socket !== next) return;
      disconnect();
      scheduleReconnect();
    };
  };

  return {
    subscribe(centerId, handlers) {
      if (!enabled) return () => undefined;
      const set = subscribers.get(centerId) ?? new Set();
      const isNewCenter = set.size === 0;
      set.add(handlers);
      subscribers.set(centerId, set);
      if (!socket) void connect();
      else if (isNewCenter) send({ type: "subscribe", centerId });
      return () => {
        set.delete(handlers);
        if (set.size > 0) return;
        subscribers.delete(centerId);
        send({ type: "unsubscribe", centerId });
        if (subscribers.size === 0) disconnect();
      };
    },
  };
};
