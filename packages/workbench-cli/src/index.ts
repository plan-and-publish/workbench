import { createCliRenderer, TextRenderable, type CliRenderer } from "@opentui/core"
import { existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { checkAuth, checkRepoRoot } from "./utils/gh.ts"
import { showMainMenu } from "./screens/mainMenu.ts"
import { runInitFlow, runInit, type InitState } from "./commands/init.ts"
import type { Repo } from "./screens/repoSelect.ts"

// --- CLI argument parsing ---
interface CliArgs {
  codeRepositories: string[]
  resourceRepositories: string[]
  org: string | null
  branch: string
  index: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    codeRepositories: [],
    resourceRepositories: [],
    org: null,
    branch: "main",
    index: true,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--code-repository") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        console.error("Error: --code-repository requires a URL argument")
        process.exit(1)
      }
      args.codeRepositories.push(argv[++i])
    } else if (arg === "--resource-repository") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        console.error("Error: --resource-repository requires a URL argument")
        process.exit(1)
      }
      args.resourceRepositories.push(argv[++i])
    } else if (arg === "--org") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        console.error("Error: --org requires a value")
        process.exit(1)
      }
      args.org = argv[++i]
    } else if (arg === "--branch") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        console.error("Error: --branch requires a value")
        process.exit(1)
      }
      args.branch = argv[++i]
    } else if (arg === "--index") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) {
        console.error("Error: --index requires a value (on or off)")
        process.exit(1)
      }
      const val = argv[++i]
      if (val !== "on" && val !== "off") {
        console.error("Error: --index must be 'on' or 'off'")
        process.exit(1)
      }
      args.index = val === "on"
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: workbench [options]
Options:
  --org <name>                 GitHub organization (required in non-interactive mode)
  --code-repository <url>      Code repository URL (at least one required in non-interactive mode)
  --resource-repository <url>  Resource repository URL
  --branch <name>              Branch name (default: main)
  --index <on|off>             Run indexing step (default: on)
  --help, -h                   Show this help message`)
      process.exit(0)
    } else if (arg.startsWith("--")) {
      console.error(`Error: Unknown option '${arg}'`)
      process.exit(1)
    }
  }

  return args
}

function validateCliArgs(args: CliArgs): void {
  if (!args.org) {
    console.error("Error: --org is required in non-interactive mode")
    process.exit(1)
  }
  if (args.codeRepositories.length === 0) {
    console.error("Error: at least one --code-repository is required in non-interactive mode")
    process.exit(1)
  }
}

function parseRepoUrl(url: string): { name: string; url: string; defaultBranch: string } {
  const sshMatch = url.match(/^git@github\.com:(.+?)\/(.+?)(?:\.git)?$/)
  if (sshMatch) {
    return { name: sshMatch[2], url: `https://github.com/${sshMatch[1]}/${sshMatch[2]}`, defaultBranch: "main" }
  }
  const httpsMatch = url.match(/^https?:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/)
  if (httpsMatch) {
    return { name: httpsMatch[2], url: `https://github.com/${httpsMatch[1]}/${httpsMatch[2]}`, defaultBranch: "main" }
  }
  const pathMatch = url.match(/\/([^\/]+?)(?:\.git)?$/)
  return { name: pathMatch ? pathMatch[1] : url, url, defaultBranch: "main" }
}

function buildInitState(args: CliArgs): InitState {
  const toRepo = (url: string): Repo => {
    const p = parseRepoUrl(url)
    return { name: p.name, url: p.url, defaultBranch: args.branch }
  }
  const codeRepos = args.codeRepositories.map(toRepo)
  const resourceRepos = args.resourceRepositories.map(toRepo)
  const branches = new Map<string, string>()
  for (const r of [...codeRepos, ...resourceRepos]) branches.set(r.name, args.branch)
  return { selectedOrg: args.org!, codeRepos, resourceRepos, branches, shouldIndex: args.index }
}

async function createRenderer(): Promise<CliRenderer> {
  return createCliRenderer({
    exitOnCtrlC: false,
    exitSignals: ["SIGTERM", "SIGQUIT", "SIGABRT", "SIGHUP"],
    targetFps: 30,
  })
}

function addVersionBadge(renderer: CliRenderer): void {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const { version } = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"))
  renderer.root.add(
    new TextRenderable(renderer, {
      id: "version-badge",
      content: `v${version}`,
      fg: "#888888",
      position: "absolute",
      right: 1,
      bottom: 0,
      zIndex: 1000,
    })
  )
}

// --- Startup ---
checkAuth()
checkRepoRoot()

const cliArgs = parseArgs(process.argv.slice(2))
const isNonInteractive =
  cliArgs.codeRepositories.length > 0 ||
  cliArgs.resourceRepositories.length > 0 ||
  cliArgs.org !== null

const renderer = await createRenderer()
addVersionBadge(renderer)

if (isNonInteractive) {
  // --- Non-interactive mode ---
  validateCliArgs(cliArgs)
  const state = buildInitState(cliArgs)

  process.on("SIGINT", () => {
    renderer.destroy()
    process.exit(0)
  })

  await runInit(renderer, state, () => {
    renderer.destroy()
    process.exit(0)
  })
} else {
  // --- Interactive TUI mode ---
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
          if (ctrlCNode) { renderer.root.remove(ctrlCNode.id); ctrlCNode = null }
          ctrlCTimer = null
        }, 3000)
      }
    }
  })

  process.on("uncaughtException", () => { renderer.destroy(); process.exit(1) })
  process.on("unhandledRejection", () => { renderer.destroy(); process.exit(1) })

  const isInitialized = existsSync(".workbench/config.yaml")
  function launchMainMenu(initialized: boolean): void {
    showMainMenu(renderer, initialized, {
      onInit: () => runInitFlow(renderer, launchMainMenu),
      onExit: () => { renderer.destroy(); process.exit(0) },
    })
  }
  launchMainMenu(isInitialized)
}
