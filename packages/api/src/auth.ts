/**
 * Đăng nhập với CX API (Better Auth). Phiên là một "session token" dài hạn
 * (cookie httpOnly trên web, SecureStore trên mobile); từ đó đổi lấy JWT ngắn hạn.
 */

export interface CxUser {
  id: string;
  email: string;
  name: string;
}

export interface AccessToken {
  accessToken: string;
  /** Unix giây. */
  expiresAt: number;
  user: CxUser;
}

export type AuthResult =
  | { ok: true; sessionToken: string; user: CxUser }
  | { ok: false; error: string };

const trimSlash = (url: string) => url.replace(/\/+$/u, "");

const authRequest = async (
  apiUrl: string,
  path: string,
  body: Record<string, string>,
  origin?: string,
): Promise<AuthResult> => {
  const response = await fetch(`${trimSlash(apiUrl)}/auth${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as {
    token?: string;
    user?: CxUser;
    message?: string;
    code?: string;
  } | null;
  const sessionToken =
    response.headers.get("set-auth-token") ?? payload?.token ?? null;
  if (!response.ok || !sessionToken || !payload?.user) {
    return {
      ok: false,
      error: payload?.code ?? payload?.message ?? `HTTP ${response.status}`,
    };
  }
  return { ok: true, sessionToken, user: payload.user };
};

export const signInWithPassword = (
  apiUrl: string,
  credentials: { email: string; password: string },
  origin?: string,
) => authRequest(apiUrl, "/sign-in/email", credentials, origin);

export const signUpWithPassword = (
  apiUrl: string,
  input: { email: string; password: string; name: string },
  origin?: string,
) => authRequest(apiUrl, "/sign-up/email", input, origin);

export const signOut = async (
  apiUrl: string,
  sessionToken: string,
  origin?: string,
) => {
  await fetch(`${trimSlash(apiUrl)}/auth/sign-out`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: "{}",
  }).catch(() => undefined);
};

/** Đổi session token lấy JWT; `null` khi phiên hết hạn hoặc bị thu hồi. */
export const fetchAccessToken = async (
  apiUrl: string,
  sessionToken: string,
): Promise<AccessToken | null> => {
  const response = await fetch(`${trimSlash(apiUrl)}/auth/token`, {
    headers: { Authorization: `Bearer ${sessionToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as AccessToken;
};

/** Bộ nhớ đệm JWT: dùng lại tới khi còn 60 giây thì xin token mới. */
export const createTokenCache = (
  load: () => Promise<{ accessToken: string; expiresAt: number } | null>,
) => {
  let current: { accessToken: string; expiresAt: number } | null = null;
  let pending: Promise<string | null> | null = null;
  const get = async (): Promise<string | null> => {
    if (current && current.expiresAt - 60 > Date.now() / 1000)
      return current.accessToken;
    pending ??= load()
      .then((next) => {
        current = next;
        return next?.accessToken ?? null;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };
  return {
    get,
    clear: () => {
      current = null;
    },
  };
};
