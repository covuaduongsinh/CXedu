import { Pressable, Text, View } from "react-native";
import type { SessionStudent } from "@cxedu/api";
import { getChessLevel, type AttendanceStatus } from "@cxedu/core";

import { attendanceColors, colors, radius, space } from "@/lib/theme";

const LABELS: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  excused: "Vắng có phép",
  unexcused: "Vắng không phép",
};

interface Props {
  student: SessionStudent;
  onToggle: (status: AttendanceStatus | null) => void;
}

/** Chạm 1 lần = có mặt, chạm lại = bỏ; giữ lâu = vắng có phép. */
export const StudentTile = ({ student, onToggle }: Props) => {
  const status = student.attendance?.status ?? null;
  const background = status ? attendanceColors[status] : colors.white;
  const textColor =
    status === "excused" || !status ? colors.text : colors.white;
  return (
    <View
      style={{
        borderRadius: radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: status === "present" }}
        accessibilityLabel={`${student.fullName}, ${status ? LABELS[status] : "chưa điểm danh"}`}
        onPress={() => onToggle(status === "present" ? null : "present")}
        onLongPress={() => onToggle(status === "excused" ? null : "excused")}
        style={{ backgroundColor: background, padding: space.md, gap: 2 }}
      >
        <Text style={{ color: textColor, fontWeight: "700", fontSize: 16 }}>
          {student.fullName}
        </Text>
        <Text style={{ color: textColor, opacity: 0.85, fontSize: 13 }}>
          {status ? LABELS[status] : "Chạm để điểm danh"} · Cấp{" "}
          {getChessLevel(student.chessLevel).name} · còn{" "}
          {student.remainingLessons}/{student.totalLessons} buổi
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onToggle(status === "unexcused" ? null : "unexcused")}
        style={{
          backgroundColor: colors.white,
          paddingVertical: 6,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: status === "unexcused" ? colors.danger : colors.textMuted,
          }}
        >
          Vắng không phép
        </Text>
      </Pressable>
    </View>
  );
};
