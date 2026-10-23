import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  createCxClient,
  createTokenCache,
  fetchAccessToken,
  signInWithPassword,
  signOut as apiSignOut,
  type CxUser,
} from "@cxedu/api";

export const API_URL =
  process.env.EXPO_PUBLIC_CX_API_URL ?? "http://localhost:8787";

const SESSION_KEY = "cx_session";

/** Session token dài hạn: SecureStore (iOS Keychain/Android Keystore), localStorage trên web. */
const storage = {
  get: async () =>
    Platform.OS === "web"
      ? (globalThis.localStorage?.getItem(SESSION_KEY) ?? null)
      : SecureStore.getItemAsync(SESSION_KEY),
  set: async (value: string) =>
    Platform.OS === "web"
      ? globalThis.localStorage?.setItem(SESSION_KEY, value)
      : SecureStore.setItemAsync(SESSION_KEY, value),
  remove: async () =>
    Platform.OS === "web"
      ? globalThis.localStorage?.removeItem(SESSION_KEY)
      : SecureStore.deleteItemAsync(SESSION_KEY),
};

export interface SessionState {
  loading: boolean;
  user: CxUser | null;
}

let state: SessionState = { loading: true, user: null };
const listeners = new Set<(next: SessionState) => void>();
const setState = (next: SessionState) => {
  state = next;
  for (const listener of listeners) listener(state);
};

const tokens = createTokenCache(async () => {
  const sessionToken = await storage.get();
  if (!sessionToken) return null;
  const token = await fetchAccessToken(API_URL, sessionToken);
  if (!token) {
    await storage.remove();
    setState({ loading: false, user: null });
    return null;
  }
  if (state.user?.id !== token.user.id)
    setState({ loading: false, user: token.user });
  return token;
});

export const cx = createCxClient({
  apiUrl: API_URL,
  getAccessToken: tokens.get,
});

export const session = {
  get: () => state,
  subscribe: (listener: (next: SessionState) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Khôi phục phiên đã lưu khi mở app. */
  restore: async () => {
    if (!(await storage.get())) return setState({ loading: false, user: null });
    await tokens.get();
    if (state.loading) setState({ loading: false, user: state.user });
  },
  signIn: async (email: string, password: string) => {
    const result = await signInWithPassword(API_URL, { email, password });
    if (!result.ok) return false;
    await storage.set(result.sessionToken);
    tokens.clear();
    setState({ loading: false, user: result.user });
    return true;
  },
  signOut: async () => {
    const sessionToken = await storage.get();
    if (sessionToken) await apiSignOut(API_URL, sessionToken);
    await storage.remove();
    tokens.clear();
    setState({ loading: false, user: null });
  },
};
