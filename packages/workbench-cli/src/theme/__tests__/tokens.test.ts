import { describe, it, expect } from "bun:test"
import { palette, lightOverrides } from "../palette"
import { buildTokens } from "../tokens"

describe("theme integrity", () => {
  const darkTokens = buildTokens("dark")
  const lightTokens = buildTokens("light")

  /** Collect all fg values from token tree */
  function collectFgValues(tokens: Record<string, unknown>): string[] {
    const values: string[] = []
    for (const value of Object.values(tokens)) {
      if (value && typeof value === "object" && "fg" in (value as Record<string, unknown>)) {
        values.push((value as Record<string, unknown>).fg as string)
      }
    }
    return values
  }

  it("every token fg is a valid palette colour or light override", () => {
    const allFgs = [...collectFgValues(darkTokens), ...collectFgValues(lightTokens)]
    const validColours: Set<string> = new Set([
      ...Object.values(palette),
      ...Object.values(lightOverrides),
    ])
    for (const fg of allFgs) {
      expect(validColours.has(fg)).toBe(true)
    }
  })

  it("light overrides are a subset of palette keys", () => {
    for (const key of Object.keys(lightOverrides)) {
      expect(key in palette).toBe(true)
    }
  })

  it("all required token groups are defined", () => {
    const requiredGroups = ["title", "subtitle", "error", "warning", "ctrlCPrompt", "spinner", "input", "output", "selection"]
    for (const group of requiredGroups) {
      expect(group in darkTokens).toBe(true)
      expect(group in lightTokens).toBe(true)
    }
  })

  it("input tokens have background, focusedBackground, and text.fg", () => {
    for (const tokens of [darkTokens, lightTokens]) {
      expect(typeof tokens.input.background).toBe("string")
      expect(typeof tokens.input.focusedBackground).toBe("string")
      expect(typeof tokens.input.text.fg).toBe("string")
    }
  })

  it("output tokens have fg and attributes", () => {
    for (const tokens of [darkTokens, lightTokens]) {
      expect(typeof tokens.output.header.fg).toBe("string")
      expect(typeof tokens.output.header.attributes).toBe("number")
      expect(typeof tokens.output.line.fg).toBe("string")
      expect(typeof tokens.output.line.attributes).toBe("number")
    }
  })

  it("selection tokens have foreground and background strings", () => {
    for (const tokens of [darkTokens, lightTokens]) {
      expect(typeof tokens.selection.foreground).toBe("string")
      expect(typeof tokens.selection.background).toBe("string")
    }
  })

  it("dark and light tokens differ only for adaptive colours", () => {
    // These 3 should differ
    expect(darkTokens.subtitle.fg).not.toBe(lightTokens.subtitle.fg)
    expect(darkTokens.input.text.fg).not.toBe(lightTokens.input.text.fg)
    expect(darkTokens.output.line.fg).not.toBe(lightTokens.output.line.fg)
    // These should be the same
    expect(darkTokens.title.fg).toBe(lightTokens.title.fg)
    expect(darkTokens.error.fg).toBe(lightTokens.error.fg)
    expect(darkTokens.warning.fg).toBe(lightTokens.warning.fg)
    expect(darkTokens.ctrlCPrompt.fg).toBe(lightTokens.ctrlCPrompt.fg)
    expect(darkTokens.spinner.fg).toBe(lightTokens.spinner.fg)
    expect(darkTokens.input.background).toBe(lightTokens.input.background)
  })
})
