import { existsSync } from "fs"
import { runCommand } from "../utils/spawn.ts"
import { forkRepo, repoExists, validateRepoName } from "../utils/gh.ts"
import { showInitOrgSelect } from "../screens/initOrgSelect.ts"
import { showInitNameInput } from "../screens/initNameInput.ts"
import { showInitSetupPrompt } from "../screens/initSetupPrompt.ts"
import { showExecutingScreen } from "../screens/executing.ts"
import type { InitProgress } from "./init.ts"
import type { CliRenderer } from "@opentui/core"
import type { CliArgs } from "../args.ts"

const SOURCE_REPO = "plan-and-publish/workbench"

export interface InitialiseState {
  name: string
  noFork: boolean
  targetOrg: string
  isPersonalAccount: boolean
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
  state: InitialiseState,
  progress: InitProgress
): Promise<{ success: boolean; error?: string }> {
  if (state.noFork) {
    return { success: true }
  }

  const exists = await repoExists(state.targetOrg, state.name)
  if (exists) {
    return { success: false, error: `A repository named "${state.name}" already exists under ${state.targetOrg}.` }
  }

  const { onLine, startThrottle, stopThrottle } = progress
  onLine(`--- Forking and cloning into ./${state.name}/ ---`, true, false)
  startThrottle()
  try {
    await forkRepo(
      SOURCE_REPO,
      state.isPersonalAccount ? undefined : state.targetOrg,
      state.name,
      (line, isStderr, isCR) => onLine(line, false, isCR)
    )
  } finally {
    stopThrottle()
  }

  return { success: true }
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
      await runCommand("git", ["clone", "--depth", "1", "--single-branch", cloneUrl, name], (line, _, isCR) =>
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

  if (state.noFork) {
    const cloneUrl = `https://github.com/${SOURCE_REPO}.git`
    return executeClone(cloneUrl, state.name, progress)
  }

  const forkResult = await executeFork(state, progress)
  if (!forkResult.success) {
    return { success: false, error: forkResult.error }
  }

  process.chdir(state.name)
  progress.onLine(`Working directory changed to ./${state.name}/`, false, false)
  return { success: true, targetDir: state.name }
}

export function runInitialiseFlow(
  renderer: CliRenderer,
  args: CliArgs,
  onComplete: () => void
): void {
  void showInitOrgSelect(renderer, args.org, (targetOrg, isPersonalAccount) => {
    setTimeout(() => {
      showInitNameInput(renderer, args.name, (name) => {
        const state: InitialiseState = { name, noFork: args.noFork, targetOrg, isPersonalAccount }
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
  const { appendLine, startThrottle, stopThrottle, container } = showExecutingScreen(renderer)
  const progress: InitProgress = {
    onLine: (line, isHeader, isCR) => appendLine(line, isHeader, isCR),
    startThrottle,
    stopThrottle,
  }

  let success: boolean

  if (!state.noFork) {
    const forkResult = await executeFork(state, progress)
    if (!forkResult.success) {
      appendLine(`Error: ${forkResult.error}`, true)
      success = false
    } else {
      process.chdir(state.name)
      progress.onLine(`Working directory changed to ./${state.name}/`, false, false)
      success = true
    }
  } else {
    const cloneUrl = `https://github.com/${SOURCE_REPO}.git`
    const result = await executeClone(cloneUrl, state.name, progress)
    success = result.success
    if (!result.success) {
      appendLine(`Error: ${result.error}`, true)
    }
  }

  if (success) {
    appendLine("--- Initialisation complete ---", true)
  }

  const handler = () => {
    renderer.keyInput.off("keypress", handler)
    container.visible = false
    onDone(success)
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
