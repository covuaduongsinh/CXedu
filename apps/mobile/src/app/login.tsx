import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { brand } from "@cxedu/ui-tokens";

import { supabase } from "@/lib/supabase";
import { colors, space, ui } from "@/lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const signIn = async () => {
    setPending(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPending(false);
    if (authError) setError("Email hoặc mật khẩu chưa đúng");
    else router.replace("/");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[ui.screen, { backgroundColor: colors.primary }]}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          padding: space.lg,
          gap: space.md,
        }}
      >
        <Text style={{ color: colors.white, fontSize: 36, fontWeight: "900" }}>
          CX<Text style={{ color: colors.orange }}>edu</Text>
        </Text>
        <Text style={{ color: colors.gold, letterSpacing: 2 }}>
          {brand.slogan.toUpperCase()}
        </Text>
        <View style={[ui.card, { marginTop: space.lg }]}>
          <TextInput
            style={ui.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            accessibilityLabel="Email"
          />
          <TextInput
            style={ui.input}
            placeholder="Mật khẩu"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            accessibilityLabel="Mật khẩu"
          />
          {error && <Text style={ui.error}>{error}</Text>}
          <Pressable
            style={[ui.button, ui.buttonAccent]}
            onPress={signIn}
            disabled={pending}
            accessibilityRole="button"
          >
            {pending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={ui.buttonText}>Đăng nhập</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
