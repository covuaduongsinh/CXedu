import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import {
  useRealtimeSync,
  useTodaySessions,
  useToggleAttendance,
} from "@cxedu/api/react";
import { todayIn } from "@cxedu/core";

import { StudentTile } from "@/components/StudentTile";
import { cx, session as auth } from "@/lib/cx";
import { colors, space, ui } from "@/lib/theme";
import { useSession } from "@/lib/useSession";
import { useWorkspace } from "@/lib/useWorkspace";

export default function TodayScreen() {
  const { user, loading } = useSession();
  const workspace = useWorkspace(user?.id);
  const centerId = workspace.data?.center?.id ?? null;
  const date = todayIn(workspace.data?.org.timezone ?? "Asia/Ho_Chi_Minh");
  const sessions = useTodaySessions(cx, centerId, date);
  const toggle = useToggleAttendance(cx, centerId ?? "", date);
  useRealtimeSync(cx, centerId, workspace.data?.org.id ?? null);

  if (loading)
    return (
      <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
    );
  if (!user) return <Redirect href="/login" />;

  return (
    <ScrollView
      style={ui.screen}
      contentContainerStyle={ui.content}
      refreshControl={
        <RefreshControl
          refreshing={sessions.isFetching}
          onRefresh={() => void sessions.refetch()}
        />
      }
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={ui.title}>{workspace.data?.center?.name ?? "…"}</Text>
          <Text style={ui.muted}>
            {date.split("-").reverse().join("/")} · {workspace.data?.org.name}
          </Text>
        </View>
        <Pressable
          style={[ui.button, ui.buttonAccent, { paddingHorizontal: space.md }]}
          onPress={() => router.push("/scan")}
        >
          <Text style={ui.buttonText}>Check-in</Text>
        </Pressable>
      </View>

      <Text style={ui.muted}>
        Chạm = có mặt · chạm lại = bỏ · giữ lâu = vắng có phép
      </Text>
      {toggle.isError && <Text style={ui.error}>{toggle.error.message}</Text>}
      {sessions.isPending && centerId && (
        <ActivityIndicator color={colors.primary} />
      )}
      {sessions.data?.length === 0 && (
        <Text style={ui.muted}>Hôm nay không có lớp theo lịch.</Text>
      )}

      {sessions.data?.map((session) => (
        <View key={session.slotId ?? "extra"} style={ui.card}>
          <Text style={ui.heading}>
            {session.name}
            {session.startTime
              ? `  ${session.startTime}–${session.endTime}`
              : ""}
          </Text>
          <Text style={ui.muted}>
            {
              session.students.filter((s) => s.attendance?.status === "present")
                .length
            }
            /{session.students.length} có mặt
          </Text>
          <View style={{ gap: space.sm }}>
            {session.students.map((student) => (
              <StudentTile
                key={student.enrollmentId}
                student={student}
                onToggle={(status) =>
                  toggle.mutate({ student, slotId: session.slotId, status })
                }
              />
            ))}
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => void auth.signOut()}
        style={{ alignItems: "center", padding: space.md }}
      >
        <Text style={ui.muted}>Đăng xuất</Text>
      </Pressable>
    </ScrollView>
  );
}
