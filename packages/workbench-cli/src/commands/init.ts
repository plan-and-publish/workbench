import { type CliRenderer, type KeyEvent } from "@opentui/core"
import { showOrgSelect } from "../screens/orgSelect.ts"
import { showRepoSelect, type Repo } from "../screens/repoSelect.ts"
import { showBranchConfig } from "../screens/branchConfig.ts"
import { showIndexPrompt } from "../screens/indexPrompt.ts"
import { showExecutingScreen } from "../screens/executing.ts"
import { runCommand } from "../utils/spawn.ts"
import { createSpinner } from "../utils/spinner.ts"
import { writeConfig } from "../utils/config.ts"
import { mkdirSync } from "fs"

export interface InitState {
  selectedOrg: string
  codeRepos: Repo[]
  resourceRepos: Repo[]
  branches: Map<string, string>
  shouldIndex: boolean
}

export interface InitProgress {
  onLine: (line: string, isHeader: boolean, isCarriageReturn: boolean) => void
  startThrottle: () => void
  stopThrottle: () => void
}

export interface InitResult {
  success: boolean
  error?: Error
}

export async function executeInit(
  state: InitState,
  progress: InitProgress,
  renderer?: CliRenderer
): Promise<InitResult> {
  const { onLine, startThrottle, stopThrottle } = progress

  try {
    onLine("--- Creating .workbench/ directory ---", true, false)
    mkdirSync(".workbench", { recursive: true })
    onLine("Created .workbench/", false, false)

    for (const repo of state.codeRepos) {
      const branch = state.branches.get(repo.name) ?? repo.defaultBranch
      const destPath = `projects/${repo.name}`

      onLine(`--- Adding ${destPath} ---`, true, false)
      startThrottle()
      try {
        await runCommand("git", ["submodule", "add", repo.url, destPath], (line, _, isCR) =>
          onLine(line, false, isCR)
        )
      } finally {
        stopThrottle()
      }

      onLine(`--- Checking out branch ${branch} for ${repo.name} ---`, true, false)
      startThrottle()
      try {
        await runCommand("git", ["-C", destPath, "checkout", branch], (line, _, isCR) =>
          onLine(line, false, isCR)
        )
      } catch {
        await runCommand("git", ["-C", destPath, "checkout", "-b", branch], (line, _, isCR) =>
          onLine(line, false, isCR)
        )
      } finally {
        stopThrottle()
      }
    }

    for (const repo of state.resourceRepos) {
      const branch = state.branches.get(repo.name) ?? repo.defaultBranch
      const destPath = `resources/${repo.name}`

      onLine(`--- Adding ${destPath} ---`, true, false)
      startThrottle()
      try {
        await runCommand("git", ["submodule", "add", repo.url, destPath], (line, _, isCR) =>
          onLine(line, false, isCR)
        )
      } finally {
        stopThrottle()
      }

      onLine(`--- Checking out branch ${branch} for ${repo.name} ---`, true, false)
      startThrottle()
      try {
        await runCommand("git", ["-C", destPath, "checkout", branch], (line, _, isCR) =>
          onLine(line, false, isCR)
        )
      } catch {
        await runCommand("git", ["-C", destPath, "checkout", "-b", branch], (line, _, isCR) =>
          onLine(line, false, isCR)
        )
      } finally {
        stopThrottle()
      }
    }

    onLine("--- Writing .workbench/config.yaml ---", true, false)
    writeConfig(state.selectedOrg, state.codeRepos, state.resourceRepos, state.branches)
    onLine("Config written successfully.", false, false)

    if (state.shouldIndex) {
      onLine("--- Running ck --index ---", true, false)
      if (renderer) {
        const indexSpinner = createSpinner(renderer, "Indexing...")
        indexSpinner.start()
        startThrottle()
        try {
          await runCommand("ck", ["--index"], (line, _, isCR) => onLine(line, false, isCR))
          onLine("Indexing complete.", false, false)
        } catch (err) {
          onLine(`Warning: ck --index failed: ${err}. Continuing...`, false, false)
        } finally {
          indexSpinner.stop()
          stopThrottle()
        }
      } else {
        startThrottle()
        try {
          await runCommand("ck", ["--index"], (line, _, isCR) => onLine(line, false, isCR))
          onLine("Indexing complete.", false, false)
        } catch (err) {
          onLine(`Warning: ck --index failed: ${err}. Continuing...`, false, false)
        } finally {
          stopThrottle()
        }
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

export function runInitFlow(
  renderer: CliRenderer,
  onComplete: (initialized: boolean) => void
): void {
  const state: Partial<InitState> = {}

  void showOrgSelect(renderer, (orgLogin) => {
    state.selectedOrg = orgLogin

    void showRepoSelect(renderer, orgLogin, "Select Code Repositories (projects/)", (codeRepos) => {
      state.codeRepos = codeRepos

      void showRepoSelect(
        renderer,
        orgLogin,
        "Select Resource Repositories (resources/)",
        (resourceRepos) => {
          state.resourceRepos = resourceRepos

          const allRepos = [...codeRepos, ...resourceRepos]
          setTimeout(() => {
            showBranchConfig(renderer, allRepos, (branches) => {
              state.branches = branches

              setTimeout(() => {
                showIndexPrompt(renderer, (shouldIndex) => {
                  state.shouldIndex = shouldIndex

                  void runInit(renderer, state as InitState, onComplete)
                })
              }, 0)
            })
          }, 0)
        }
      )
    })
  })
}

async function runInit(
  renderer: CliRenderer,
  state: InitState,
  onComplete: (initialized: boolean) => void
): Promise<void> {
  const { appendLine, startThrottle, stopThrottle, container: execContainer } =
    showExecutingScreen(renderer)

  const progress: InitProgress = {
    onLine: (line, isHeader, isCR) => appendLine(line, isHeader, isCR),
    startThrottle,
    stopThrottle,
  }

  const result = await executeInit(state, progress, renderer)

  if (result.success) {
    appendLine(" ", false)
    appendLine("--- Init complete! Press any key to return to menu ---", true)
  } else {
    appendLine(" ", false)
    appendLine(`--- Error: ${result.error} ---`, true)
    appendLine("Init aborted. Press any key to return to menu.", false)
  }

  const keypressHandler = (_key: KeyEvent) => {
    renderer.keyInput.off("keypress", keypressHandler)
    execContainer.visible = false
    onComplete(result.success)
  }
  renderer.keyInput.on("keypress", keypressHandler)
}
