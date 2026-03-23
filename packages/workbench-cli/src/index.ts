import { createCliRenderer, TextRenderable, type CliRenderer } from "@opentui/core"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { checkAuth, checkRepoRoot } from "./utils/gh.ts"
import { showMainMenu } from "./screens/mainMenu.ts"
import { runInitFlow, runInitCore, type InitState } from "./commands/init.ts"
import { parseCliArgs, validateArgs, showHelp, type ParsedArgs } from "./utils/args.ts"

function extractRepoName(url: string): string {
  const parts = url.split("/")
  const name = parts[parts.length - 1]?.replace(/\.git$/, "") ?? url
  return name
}

async function runHeadless(args: ParsedArgs): Promise<void> {
  checkAuth()
  checkRepoRoot()

  const state: InitState = {
    selectedOrg: args.org!,
    codeRepos: args.codeRepositories.map((url) => ({
      name: extractRepoName(url),
      url,
      defaultBranch: args.codeBranch,
    })),
    resourceRepos: args.resourceRepositories.map((url) => ({
      name: extractRepoName(url),
      url,
      defaultBranch: args.resourceBranch,
    })),
    branches: new Map(),
    shouldIndex: args.index,
  }

  for (const repo of state.codeRepos) {
    state.branches.set(repo.name, args.codeBranch)
  }
  for (const repo of state.resourceRepos) {
    state.branches.set(repo.name, args.resourceBranch)
  }

  await runInitCore(state)
}

const args = parseCliArgs()

if (args === null) {
  showHelp()
  process.exit(0)
}

if (args.help) {
  showHelp()
  process.exit(0)
}

if (args.tui) {
  checkAuth()
  checkRepoRoot()

  const renderer: CliRenderer = await createCliRenderer({
    exitOnCtrlC: false,
    exitSignals: ["SIGTERM", "SIGQUIT", "SIGABRT", "SIGHUP"],
    targetFps: 30,
  })

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const { version } = JSON.parse(
    readFileSync(join(__dirname, "..", "package.json"), "utf-8")
  )

  const versionBadge = new TextRenderable(renderer, {
    id: "version-badge",
    content: `v${version}`,
    fg: "#888888",
    position: "absolute",
    right: 1,
    bottom: 0,
    zIndex: 1000,
  })
  renderer.root.add(versionBadge)

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

  const isInitialized = existsSync(".workbench/config.yaml")

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
} else {
  const error = validateArgs(args)
  if (error) {
    console.error(error)
    process.exit(1)
  }

  runHeadless(args)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err.message)
      process.exit(1)
    })
}
