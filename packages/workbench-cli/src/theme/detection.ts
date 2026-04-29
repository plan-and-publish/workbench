import { TerminalPalette } from "@opentui/core"

const OSC_TIMEOUT_MS = 300

/**
 * Calculate relative luminance of a hex colour.
 * Returns 0.0 (black) to 1.0 (white).
 * Uses sRGB coefficients per WCAG 2.0.
 */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Detect terminal background colour and determine light/dark mode.
 * Falls back to "dark" on any failure (timeout, unsupported terminal, etc.).
 */
export async function detectTerminalMode(): Promise<"light" | "dark"> {
  if (!process.stdout.isTTY || !process.stdin.isTTY) return "dark"
  const detector = new TerminalPalette(process.stdin, process.stdout)
  try {
    const supported = await detector.detectOSCSupport(OSC_TIMEOUT_MS)
    if (!supported) return "dark"
    const colors = await detector.detect({ timeout: OSC_TIMEOUT_MS })
    const bg = colors.defaultBackground
    if (!bg || !/^#[0-9a-fA-F]{6}$/.test(bg)) return "dark"
    return luminance(bg) > 0.5 ? "light" : "dark"
  } catch {
    return "dark"
  } finally {
    detector.cleanup()
  }
}
