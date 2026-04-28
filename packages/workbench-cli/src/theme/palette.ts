export const palette = {
  cyan: "#00FFFF",
  gray: "#888888",
  red: "#FF4444",
  orange: "#FF8800",
  yellow: "#FFFF00",
  white: "#FFFFFF",
  dimGray: "#666666",
  darkBg: "#1a1a1a",
  focusedBg: "#2a2a2a",
} as const

/** Light-mode overrides for colours that become unreadable on light backgrounds */
export const lightOverrides = {
  gray: "#555555",      // subtitle
  white: "#1a1a1a",     // input text
  dimGray: "#444444",   // output lines
} as const
