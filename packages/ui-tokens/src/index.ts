/** Bảng màu thương hiệu Dương Sinh — dùng chung cho web, mobile, desktop. */
export const colors = {
  primary: "#2B3990",
  primaryDark: "#1F2A6E",
  primarySoft: "#E8EAF6",
  blue: "#2275B4",
  teal: "#3DBB95",
  green: "#2DA44A",
  orange: "#F7941D",
  orangeDark: "#E8850F",
  gold: "#FBB040",
  bg: "#F8F9FC",
  white: "#FFFFFF",
  text: "#1A1A2E",
  textMuted: "#6B7280",
  border: "#E2E5EF",
  danger: "#D93636",
} as const;

/** Màu theo trạng thái điểm danh, giữ nhất quán giữa các nền tảng. */
export const attendanceColors = {
  present: colors.green,
  excused: colors.gold,
  unexcused: colors.danger,
  makeup: colors.blue,
  pending: colors.border,
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 4, md: 8, lg: 12, pill: 999 } as const;

export const fontFamily = "Roboto";

export const brand = {
  name: "CXedu",
  owner: "Dương Sinh — CLB Cờ vua",
  slogan: "Vui trí tuệ",
} as const;
