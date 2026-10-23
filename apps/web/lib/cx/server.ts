import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import {
  createCxClient,
  fetchAccessToken,
  type AccessToken,
  type CxClient,
} from "@cxedu/api";

import { env } from "../env";

/** Cookie httpOnly giữ session token của Better Auth trên domain web. */
export const SESSION_COOKIE = "cx_session";

/** Phiên hiện tại (đã kiểm với CX API) kèm JWT ngắn hạn; `null` nếu chưa đăng nhập/hết hạn. */
export const getServerSession = cache(
  async (): Promise<(AccessToken & { sessionToken: string }) | null> => {
    const sessionToken = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!sessionToken) return null;
    const token = await fetchAccessToken(env.apiInternalUrl, sessionToken);
    return token ? { ...token, sessionToken } : null;
  },
);

/** Client dữ liệu phía server, mang JWT của người đang đăng nhập (hoặc khách). */
export const createCxServer = async (): Promise<CxClient> => {
  const session = await getServerSession();
  return createCxClient({
    apiUrl: env.apiInternalUrl,
    getAccessToken: async () => session?.accessToken ?? null,
    realtime: false,
  });
};

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
