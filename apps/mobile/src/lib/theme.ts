import { StyleSheet } from "react-native";
import { colors, radius, space } from "@cxedu/ui-tokens";

export { attendanceColors, colors, radius, space } from "@cxedu/ui-tokens";

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, gap: space.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.primary },
  heading: { fontSize: 16, fontWeight: "700", color: colors.primary },
  muted: { fontSize: 13, color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonAccent: { backgroundColor: colors.orange },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  error: { color: colors.danger, fontSize: 14 },
});
