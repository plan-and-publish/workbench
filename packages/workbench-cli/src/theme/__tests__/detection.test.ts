import { describe, it, expect } from "bun:test"
import { detectTerminalMode } from "../detection"

describe("terminal detection", () => {
  it("returns 'dark' when OSC is not supported (CI environment)", async () => {
    const mode = await detectTerminalMode()
    expect(mode).toBe("dark")
  })
})
