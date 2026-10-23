/** Query key dùng chung để web, mobile, desktop invalidate giống nhau khi có Realtime. */
export const queryKeys = {
  organizations: () => ["organizations"] as const,
  centers: (orgId: string) => ["centers", orgId] as const,
  todaySessions: (centerId: string, date: string) =>
    ["today-sessions", centerId, date] as const,
  dashboard: (orgId: string) => ["dashboard", orgId] as const,
  students: (orgId: string) => ["students", orgId] as const,
};
