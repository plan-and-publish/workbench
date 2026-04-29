import { TextAttributes } from "@opentui/core"
import { palette, lightOverrides } from "./palette"

type PaletteKey = keyof typeof palette

export type Tokens = typeof darkTokens

function resolveColour(key: PaletteKey, mode: "light" | "dark"): string {
  if (mode === "light" && key in lightOverrides) {
    return lightOverrides[key as keyof typeof lightOverrides]
  }
  return palette[key]
}

function buildTokens(mode: "light" | "dark") {
  return {
    title: { fg: palette.cyan },
    subtitle: { fg: resolveColour("gray", mode) },
    error: { fg: palette.red },
    warning: { fg: palette.orange },
    ctrlCPrompt: { fg: palette.yellow },
    spinner: { fg: palette.cyan },
    input: {
      text: { fg: resolveColour("white", mode) },
      background: palette.darkBg,
      focusedBackground: palette.focusedBg,
    },
    output: {
      header: { fg: palette.white, attributes: TextAttributes.BOLD },
      line: { fg: resolveColour("dimGray", mode), attributes: TextAttributes.DIM },
    },
    selection: {
      foreground: palette.white,
      background: palette.darkBg,
    },
  }
}

const darkTokens = buildTokens("dark")

export { buildTokens }
