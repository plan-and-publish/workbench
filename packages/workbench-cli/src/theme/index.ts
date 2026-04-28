import { palette } from "./palette"
import { buildTokens, type Tokens } from "./tokens"

let currentMode: "light" | "dark" = "dark"
let currentTokens: Tokens = buildTokens("dark")

export const theme = {
  palette,
  get mode() {
    return currentMode
  },
  get tokens() {
    return currentTokens
  },
}

/**
 * Detect terminal background and re-resolve tokens for the detected mode.
 * Call once at app startup, before renderer creation.
 * Safe to call multiple times — re-detects each time.
 */
export async function detectMode(): Promise<void> {
  const { detectTerminalMode } = await import("./detection")
  currentMode = await detectTerminalMode()
  currentTokens = buildTokens(currentMode)
}
