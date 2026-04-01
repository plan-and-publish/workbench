import { existsSync } from "fs"
import { runCommand } from "../utils/spawn.ts"
import { forkRepo, repoExists, validateRepoName } from "../utils/gh.ts"
import { showInitOrgSelect } from "../screens/initOrgSelect.ts"
import { showInitNameInput } from "../screens/initNameInput.ts"
import { showInitSetupPrompt } from "../screens/initSetupPrompt.ts"
import { showExecutingScreen } from "../screens/executing.ts"
import { createSpinner } from "../utils/spinner.ts"
import type { InitProgress } from "./init.ts"
import type { CliRenderer } from "@opentui/core"
import type { CliArgs } from "../args.ts"

const SOURCE_REPO = "plan-and-publish/workbench"

export interface InitialiseState {
  name: string
  noFork: boolean
  targetOrg: string
}

export interface InitialiseResult {
  success: boolean
  error?: string
  targetDir?: string
}

export function validateInitialiseState(state: InitialiseState): string | null {
  if (!validateRepoName(state.name)) {
    return `Invalid name "${state.name}". Use only alphanumeric characters, hyphens, dots, and underscores.`
  }
  if (existsSync(state.name)) {
    return `A folder named "${state.name}" already exists in the current directory.`
  }
  return null
}

export async function executeFork(
  state: InitialiseState
): Promise<{ success: boolean; error?: string; cloneUrl?: string }> {
  if (state.noFork) {
    return { success: true, cloneUrl: `https://github.com/${SOURCE_REPO}.git` }
  }

  const exists = await repoExists(state.targetOrg, state.name)
  if (exists) {
    return { success: false, error: `A repository named "${state.name}" already exists under ${state.targetOrg}.` }
  }

  const forkResult = await forkRepo(SOURCE_REPO, state.targetOrg, state.name)
  return { success: true, cloneUrl: forkResult.url }
}

export async function executeClone(
  cloneUrl: string,
  name: string,
  progress: InitProgress
): Promise<InitialiseResult> {
  const { onLine, startThrottle, stopThrottle } = progress

  try {
    if (existsSync(name)) {
      return { success: false, error: `A folder named "${name}" already exists in the current directory.` }
    }

    onLine(`--- Cloning into ./${name}/ ---`, true, false)
    startThrottle()
    try {
      await runCommand("git", ["clone", "--depth", "1", cloneUrl, name], (line, _, isCR) =>
        onLine(line, false, isCR)
      )
    } finally {
      stopThrottle()
    }

    process.chdir(name)
    onLine(`Working directory changed to ./${name}/`, false, false)

    return { success: true, targetDir: name }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function executeInitialise(
  state: InitialiseState,
  progress: InitProgress
): Promise<InitialiseResult> {
  const validationError = validateInitialiseState(state)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const forkResult = await executeFork(state)
  if (!forkResult.success) {
    return { success: false, error: forkResult.error }
  }

  return executeClone(forkResult.cloneUrl!, state.name, progress)
}

export function runInitialiseFlow(
  renderer: CliRenderer,
  args: CliArgs,
  onComplete: () => void
): void {
  void showInitOrgSelect(renderer, args.org, (targetOrg) => {
    setTimeout(() => {
      showInitNameInput(renderer, args.name, (name) => {
        const state: InitialiseState = { name, noFork: args.noFork, targetOrg }
        void runTuiInitialise(renderer, state, (success) => {
          if (!success) {
            onComplete()
            return
          }
          setTimeout(() => {
            showInitSetupPrompt(renderer, (shouldSetup) => {
              if (shouldSetup) {
                void runTuiSetupAfterInit(renderer, onComplete)
              } else {
                console.log("\nTo set up your workbench later, run: workbench --tui")
                renderer.destroy()
                process.exit(0)
              }
            })
          }, 0)
        })
      })
    }, 0)
  })
}

async function runTuiInitialise(
  renderer: CliRenderer,
  state: InitialiseState,
  onDone: (success: boolean) => void
): Promise<void> {
  let cloneUrl: string

  if (!state.noFork) {
    const spinner = createSpinner(renderer, `Forking to ${state.targetOrg}/${state.name}...`)
    spinner.start()
    const forkResult = await executeFork(state)
    spinner.stop()

    if (!forkResult.success) {
      const { appendLine, container } = showExecutingScreen(renderer)
      appendLine(`Error: ${forkResult.error}`, true)
      const handler = () => {
        renderer.keyInput.off("keypress", handler)
        container.visible = false
        onDone(false)
      }
      renderer.keyInput.on("keypress", handler)
      return
    }
    cloneUrl = forkResult.cloneUrl!
  } else {
    cloneUrl = `https://github.com/${SOURCE_REPO}.git`
  }

  const { appendLine, startThrottle, stopThrottle, container } = showExecutingScreen(renderer)
  const progress: InitProgress = {
    onLine: (line, isHeader, isCR) => appendLine(line, isHeader, isCR),
    startThrottle,
    stopThrottle,
  }

  const result = await executeClone(cloneUrl, state.name, progress)

  if (!result.success) {
    appendLine(`Error: ${result.error}`, true)
  } else {
    appendLine("--- Initialisation complete ---", true)
  }

  const handler = () => {
    renderer.keyInput.off("keypress", handler)
    container.visible = false
    onDone(result.success)
  }
  renderer.keyInput.on("keypress", handler)
}

async function runTuiSetupAfterInit(
  renderer: CliRenderer,
  onComplete: () => void
): Promise<void> {
  const { runInitFlow } = await import("./init.ts")
  runInitFlow(renderer, (_success) => {
    onComplete()
  })
}
