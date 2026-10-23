import { useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { colors } from "@/lib/theme";

export default function RootLayout() {
  const [client] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { staleTime: 15_000 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Điểm danh hôm nay" }} />
        <Stack.Screen
          name="login"
          options={{ title: "CXedu", headerShown: false }}
        />
        <Stack.Screen name="scan" options={{ title: "Check-in ca dạy" }} />
      </Stack>
    </QueryClientProvider>
  );
}
