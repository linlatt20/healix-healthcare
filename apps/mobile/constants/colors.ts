/**
 * Healix 모바일 색상 팔레트.
 * 원본 파일이 내보낸 코드에 빠져 있어서 웹(index.css)의 브랜드 색 —
 * primary hsl(216 100% 35%) = #0048B4, accent hsl(185 96% 33%) = #037F8A — 기준으로 다시 만들었습니다.
 */
export const Colors = {
  primary: "#0048B4",
  primaryDark: "#002D72",
  primaryLight: "#E6EEFA",

  accent: "#037F8A",
  accentLight: "#E0F5F7",

  bg: "#F7F9FC",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F4F9",
  border: "#E2E8F0",

  text: "#0F172A",
  textSecondary: "#334155",
  textMuted: "#64748B",
  tabInactive: "#94A3B8",

  success: "#059669",
  successLight: "#D1FAE5",
  warning: "#D97706",
  warningLight: "#FEF3C7",
  danger: "#E11D48",
  dangerLight: "#FFE4E6",

  overlay: "rgba(15, 23, 42, 0.45)",
  cardShadow: "#0F172A",
} as const;

export default Colors;
