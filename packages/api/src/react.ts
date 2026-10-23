import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AttendanceStatus, SessionKind } from "@cxedu/core";

import {
  fetchTodaySessions,
  markAttendance,
  unmarkAttendance,
  type SessionStudent,
  type TodaySession,
} from "./attendance";
import type { CxClient } from "./client";
import { fetchDashboard } from "./dashboard";
import { queryKeys } from "./keys";

export const useTodaySessions = (
  client: CxClient,
  centerId: string | null,
  date: string,
) =>
  useQuery({
    queryKey: queryKeys.todaySessions(centerId ?? "none", date),
    queryFn: () => fetchTodaySessions(client, centerId ?? "", date),
    enabled: centerId !== null,
  });

export const useDashboard = (client: CxClient, orgId: string | null) =>
  useQuery({
    queryKey: queryKeys.dashboard(orgId ?? "none"),
    queryFn: () => fetchDashboard(client, orgId ?? ""),
    enabled: orgId !== null,
  });

export interface ToggleAttendanceInput {
  student: SessionStudent;
  slotId: string | null;
  /** `null` = bỏ điểm danh. */
  status: AttendanceStatus | null;
  kind?: SessionKind;
}

const applyOptimistic = (
  sessions: TodaySession[] | undefined,
  input: ToggleAttendanceInput,
): TodaySession[] | undefined =>
  sessions?.map((session) => ({
    ...session,
    students: session.students.map((student) =>
      student.enrollmentId === input.student.enrollmentId &&
      session.slotId === input.slotId
        ? {
            ...student,
            attendance:
              input.status === null
                ? null
                : {
                    id: student.attendance?.id ?? "optimistic",
                    status: input.status,
                    kind: input.kind ?? "regular",
                    charged: student.attendance?.charged ?? 0,
                  },
          }
        : student,
    ),
  }));

/** Điểm danh 1 chạm: cập nhật giao diện ngay, rollback nếu server từ chối. */
export const useToggleAttendance = (
  client: CxClient,
  centerId: string,
  date: string,
) => {
  const queryClient = useQueryClient();
  const key = queryKeys.todaySessions(centerId, date);
  return useMutation({
    mutationFn: async (input: ToggleAttendanceInput) => {
      if (input.status === null) {
        if (input.student.attendance)
          await unmarkAttendance(client, input.student.attendance.id);
        return;
      }
      await markAttendance(client, {
        enrollmentId: input.student.enrollmentId,
        sessionDate: date,
        status: input.status,
        kind: input.kind ?? "regular",
        free: false,
        classSlotId: input.slotId,
      });
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TodaySession[]>(key);
      queryClient.setQueryData<TodaySession[]>(key, (current) =>
        applyOptimistic(current, input),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

/**
 * Đồng bộ realtime: khi thiết bị khác điểm danh/ghi danh ở cùng cơ sở,
 * làm mới dữ liệu đang hiển thị trên web, mobile, desktop.
 */
export const useRealtimeSync = (
  client: CxClient,
  centerId: string | null,
  orgId: string | null,
) => {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!centerId) return;
    const channel = client
      .channel(`center:${centerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `center_id=eq.${centerId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["today-sessions", centerId],
          });
          if (orgId)
            void queryClient.invalidateQueries({
              queryKey: queryKeys.dashboard(orgId),
            });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "enrollments" },
        () => {
          void queryClient.invalidateQueries({
            queryKey: ["today-sessions", centerId],
          });
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [client, centerId, orgId, queryClient]);
};
