import { SignJWT, jwtVerify } from "jose";

import { env } from "./env";

const secret = new TextEncoder().encode(env.jwtSecret);

export interface AccessClaims {
  sub: string;
  email: string;
  role: "authenticated";
}

/**
 * JWT ngắn hạn cho PostgREST: PostgREST kiểm chữ ký, đặt `role` = authenticated và
 * ghi claims vào `request.jwt.claims` để `auth.uid()` + RLS hoạt động.
 */
export const mintAccessToken = async (user: { id: string; email: string }) => {
  const expiresAt = Math.floor(Date.now() / 1000) + env.jwtTtlSeconds;
  const token = await new SignJWT({ role: "authenticated", email: user.email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setAudience("authenticated")
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret);
  return { accessToken: token, expiresAt };
};

export const verifyAccessToken = async (
  token: string,
): Promise<AccessClaims> => {
  const { payload } = await jwtVerify(token, secret, {
    audience: "authenticated",
  });
  if (typeof payload.sub !== "string" || payload.role !== "authenticated") {
    throw new Error("JWT không hợp lệ");
  }
  return {
    sub: payload.sub,
    email: String(payload.email ?? ""),
    role: "authenticated",
  };
};
