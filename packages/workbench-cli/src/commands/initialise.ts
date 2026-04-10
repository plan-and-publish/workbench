import { existsSync } from "fs"
import { runCommand } from "../utils/spawn.ts"
import { createRepo, validateRepoName } from "../utils/gh.ts"
import { showInitOrgSelect } from "../screens/initOrgSelect.ts"
import { showInitNameInput } from "../screens/initNameInput.ts"
import { showInitSetupPrompt } from "../screens/initSetupPrompt.ts"
import { showExecutingScreen } from "../screens/executing.ts"
import { showSourceInput } from "../screens/initSourceInput.ts"
import { showRemotePrompt } from "../screens/initRemotePrompt.ts"
import { showRemoteNameInput } from "../screens/initRemoteNameInput.ts"
import type { InitProgress } from "./init.ts"
import type { CliRenderer } from "@opentui/core"
import type { CliArgs } from "../args.ts"

export interface InitialiseState {
  name: string
  source: string
  targetOrg?: string
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

export async function executeClone(
  source: string,
  name: string,
  progress: InitProgress
): Promise<InitialiseResult> {
  const { onLine, startThrottle, stopThrottle } = progress
  const cloneUrl = source.includes("://") ? source : `https://github.com/${source}.git`

  try {
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

export async function executeRemoveOrigin(
  progress: InitProgress
): Promise<void> {
  try {
    await runCommand("git", ["remote", "remove", "origin"], (line, _, isCR) =>
      progress.onLine(line, false, isCR)
    )
    progress.onLine("Removed origin remote. To add a remote later: git remote add origin <url>", false, false)
  } catch {
    progress.onLine("No origin remote to remove (skipped)", false, false)
  }
}

export async function executeCreateRemote(
  org: string,
  repoName: string,
  progress: InitProgress
): Promise<InitialiseResult> {
  const { onLine } = progress
  try {
    onLine(`--- Creating private repository ${org}/${repoName} ---`, true, false)
    const output = await createRepo(org, repoName)
    const urlMatch = output.match(/https:\/\/github\.com\/[^\s]+/)
    const repoUrl = urlMatch ? urlMatch[0] : output

    await runCommand("git", ["remote", "add", "origin", repoUrl.endsWith(".git") ? repoUrl : `${repoUrl}.git`], (line, _, isCR) =>
      onLine(line, false, isCR)
    )
    onLine(`Remote origin set to ${repoUrl}`, false, false)
    return { success: true }
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

  const result = await executeClone(state.source, state.name, progress)
  if (!result.success) {
    return result
  }

  await executeRemoveOrigin(progress)
  return result
}

export function runInitialiseFlow(
  renderer: CliRenderer,
  args: CliArgs,
  onComplete: () => void
): void {
  setTimeout(() => {
    showSourceInput(renderer, args.source, (source) => {
      setTimeout(() => {
        showInitNameInput(renderer, args.name, (name) => {
          const state: InitialiseState = { name, source }
          void runTuiInitialise(renderer, state, (success) => {
            if (!success) {
              onComplete()
              return
            }
            setTimeout(() => {
              showRemotePrompt(renderer, (shouldCreateRemote) => {
                if (shouldCreateRemote) {
                  void runTuiRemoteCreation(renderer, args.org, name, () => {
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
                } else {
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
                }
              })
            }, 0)
          })
        })
      }, 0)
    })
  }, 0)
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

  const result = await executeInitialise(state, progress)
  if (!result.success) {
    appendLine(`Error: ${result.error}`, true)
  }

  if (result.success) {
    appendLine("--- Initialisation complete ---", true)
  }

  const handler = () => {
    renderer.keyInput.off("keypress", handler)
    container.visible = false
    onDone(result.success)
  }
  renderer.keyInput.on("keypress", handler)
}

async function runTuiRemoteCreation(
  renderer: CliRenderer,
  preselectedOrg: string | undefined,
  defaultRepoName: string,
  onDone: () => void
): Promise<void> {
  void showInitOrgSelect(renderer, preselectedOrg, "Create Remote Under", (orgLogin) => {
    setTimeout(() => {
      showRemoteNameInput(renderer, defaultRepoName, (repoName) => {
        void runTuiCreateRemote(renderer, orgLogin, repoName, onDone)
      })
    }, 0)
  })
}

async function runTuiCreateRemote(
  renderer: CliRenderer,
  org: string,
  repoName: string,
  onDone: () => void
): Promise<void> {
  const { appendLine, startThrottle, stopThrottle, container } = showExecutingScreen(renderer)
  const progress: InitProgress = {
    onLine: (line, isHeader, isCR) => appendLine(line, isHeader, isCR),
    startThrottle,
    stopThrottle,
  }

  const result = await executeCreateRemote(org, repoName, progress)
  if (!result.success) {
    appendLine(`Error: ${result.error}`, true)
  }

  const handler = () => {
    renderer.keyInput.off("keypress", handler)
    container.visible = false
    onDone()
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
