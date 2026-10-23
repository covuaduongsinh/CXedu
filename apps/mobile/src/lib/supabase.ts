import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createCxClient } from "@cxedu/api";

/** Một client Supabase dùng chung cho cả app; phiên lưu trong AsyncStorage (web: localStorage). */
export const supabase = createCxClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  detectSessionInUrl: Platform.OS === "web",
  ...(Platform.OS === "web" ? {} : { storage: AsyncStorage }),
});
