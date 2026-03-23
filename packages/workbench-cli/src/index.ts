import { createCliRenderer, TextRenderable, type CliRenderer } from "@opentui/core"
import { existsSync } from "fs"
import { checkAuth, checkRepoRoot } from "./utils/gh.ts"
import { showMainMenu } from "./screens/mainMenu.ts"
import { runInitFlow } from "./commands/init.ts"

// --- Startup validation (before TUI starts) ---
checkAuth()
checkRepoRoot()

// --- Renderer ---
const renderer: CliRenderer = await createCliRenderer({
  exitOnCtrlC: false,
  exitSignals: ["SIGTERM", "SIGQUIT", "SIGABRT", "SIGHUP"],
  targetFps: 30,
})

// --- Global double-Ctrl+C handler ---
let ctrlCTimer: ReturnType<typeof setTimeout> | null = null
let ctrlCNode: TextRenderable | null = null

renderer.keyInput.on("keypress", (key) => {
  if (key.ctrl && key.name === "c") {
    if (ctrlCTimer !== null) {
      clearTimeout(ctrlCTimer)
      renderer.destroy()
      process.exit(0)
    } else {
      ctrlCNode = new TextRenderable(renderer, {
        id: "ctrl-c-prompt",
        content: "Press Ctrl+C again to exit",
        fg: "#FFFF00",
      })
      renderer.root.add(ctrlCNode)
      ctrlCTimer = setTimeout(() => {
        if (ctrlCNode) {
          renderer.root.remove(ctrlCNode.id)
          ctrlCNode = null
        }
        ctrlCTimer = null
      }, 3000)
    }
  }
})

process.on("uncaughtException", () => {
  renderer.destroy()
  process.exit(1)
})
process.on("unhandledRejection", () => {
  renderer.destroy()
  process.exit(1)
})

// --- Check initial state ---
const isInitialized = existsSync(".workbench/config.yaml")

// --- Start main menu ---
function launchMainMenu(initialized: boolean): void {
  showMainMenu(renderer, initialized, {
    onInit: () => runInitFlow(renderer, launchMainMenu),
    onExit: () => {
      renderer.destroy()
      process.exit(0)
    },
  })
}

launchMainMenu(isInitialized)
