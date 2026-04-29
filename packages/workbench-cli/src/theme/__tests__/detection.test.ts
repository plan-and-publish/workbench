import { vi } from "bun:test"
import { describe, it, expect, afterEach, beforeEach } from "bun:test"
import { detectTerminalMode } from "../detection"

// Shared mutable mock state — vi.mock factory captures by reference
const mockState = {
  detectOSCSupport: async () => true,
  detectColors: { defaultBackground: "#ffffff" },
  cleanup: () => {},
}

// vi.mock is hoisted — factory runs before imports resolve
// but `vi` is imported above so it's in scope when this runs
vi.mock("@opentui/core", () => ({
  TerminalPalette: function (stdin: unknown, stdout: unknown) {
    return {
      detectOSCSupport: mockState.detectOSCSupport,
      detect: async () => mockState.detectColors,
      cleanup: mockState.cleanup,
    }
  },
}))

describe("terminal detection", () => {
  const origStdout = process.stdout
  const origStdin = process.stdin

  // Create mock stream objects with configurable isTTY
  const createMockStream = (isTTYValue: boolean) => ({
    isTTY: isTTYValue,
    write: vi.fn(),
    on: vi.fn(),
    end: vi.fn(),
  })

  // Enable TTY mode for tests that need to bypass the TTY guard
  const enableTTY = () => {
    Object.defineProperty(process, "stdout", {
      value: createMockStream(true),
      configurable: true,
    })
    Object.defineProperty(process, "stdin", {
      value: createMockStream(true),
      configurable: true,
    })
  }

  // Disable TTY mode (for non-TTY short-circuit tests)
  const disableTTY = () => {
    Object.defineProperty(process, "stdout", {
      value: createMockStream(false),
      configurable: true,
    })
    Object.defineProperty(process, "stdin", {
      value: createMockStream(false),
      configurable: true,
    })
  }

  beforeEach(() => {
    // Default: enable TTY so tests can focus on their specific behavior
    enableTTY()
    // Reset mock state
    mockState.detectOSCSupport = async () => true
    mockState.detectColors = { defaultBackground: "#ffffff" }
    mockState.cleanup = () => {}
  })

  afterEach(() => {
    Object.defineProperty(process, "stdout", { value: origStdout, configurable: true })
    Object.defineProperty(process, "stdin", { value: origStdin, configurable: true })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test: non-TTY short-circuit
  // ───────────────────────────────────────────────────────────────────────────
  describe("non-TTY short-circuit", () => {
    it("returns 'dark' immediately when stdout is not a TTY", async () => {
      disableTTY()
      const mode = await detectTerminalMode()
      expect(mode).toBe("dark")
    })

    it("returns 'dark' immediately when stdin is not a TTY", async () => {
      disableTTY()
      const mode = await detectTerminalMode()
      expect(mode).toBe("dark")
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test: timeout / unsupported OSC fallback
  // ───────────────────────────────────────────────────────────────────────────
  describe("OSC support detection", () => {
    it("returns 'dark' when detectOSCSupport returns false", async () => {
      mockState.detectOSCSupport = async () => false
      const mode = await detectTerminalMode()
      expect(mode).toBe("dark")
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test: malformed colour fallback
  // ───────────────────────────────────────────────────────────────────────────
  describe("malformed colour fallback", () => {
    it("returns 'dark' for short hex #rgb", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: "#fff" }
      expect(await detectTerminalMode()).toBe("dark")
    })

    it("returns 'dark' for 8-char hex with alpha #rrggbbaa", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: "#ffffffff" }
      expect(await detectTerminalMode()).toBe("dark")
    })

    it("returns 'dark' for rgb() format", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: "rgb(255, 255, 255)" }
      expect(await detectTerminalMode()).toBe("dark")
    })

    it("returns 'dark' for null defaultBackground", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: null }
      expect(await detectTerminalMode()).toBe("dark")
    })

    it("returns 'dark' for undefined defaultBackground", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: undefined }
      expect(await detectTerminalMode()).toBe("dark")
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // Test: valid colours (sanity checks)
  // ───────────────────────────────────────────────────────────────────────────
  describe("valid colour detection", () => {
    it("returns 'light' for bright valid hex #ffffff", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: "#ffffff" }
      expect(await detectTerminalMode()).toBe("light")
    })

    it("returns 'dark' for dark valid hex #000000", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: "#000000" }
      expect(await detectTerminalMode()).toBe("dark")
    })

    it("returns 'light' for medium gray #c0c0c0 (luminance=0.527)", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: "#c0c0c0" }
      expect(await detectTerminalMode()).toBe("light")
    })

    it("returns 'dark' for dark gray #404040 (luminance=0.051)", async () => {
      mockState.detectOSCSupport = async () => true
      mockState.detectColors = { defaultBackground: "#404040" }
      expect(await detectTerminalMode()).toBe("dark")
    })
  })
})
