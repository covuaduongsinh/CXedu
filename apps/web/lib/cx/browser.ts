"use client";

import { createCxClient, createTokenCache, type CxClient } from "@cxedu/api";

let client: CxClient | null = null;

/** JWT cho trình duyệt lấy qua route nội bộ `/api/token` (đọc cookie httpOnly phía server). */
const tokens = createTokenCache(async () => {
  const response = await fetch("/api/token", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as { accessToken: string; expiresAt: number };
});

export const getCxBrowser = (): CxClient => {
  client ??= createCxClient({
    apiUrl: process.env.NEXT_PUBLIC_CX_API_URL ?? "",
    getAccessToken: tokens.get,
  });
  return client;
};
