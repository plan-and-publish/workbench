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

interface InitState {
  selectedOrg: string
  codeRepos: Repo[]
  resourceRepos: Repo[]
  branches: Map<string, string>
  shouldIndex: boolean
}

export function runInitFlow(
  renderer: CliRenderer,
  onComplete: (initialized: boolean) => void
): void {
  const state: Partial<InitState> = {}

  // Step 1: Org selection
  void showOrgSelect(renderer, (orgLogin) => {
    state.selectedOrg = orgLogin

    // Step 2: Code repo selection
    void showRepoSelect(renderer, orgLogin, "Select Code Repositories (projects/)", (codeRepos) => {
      state.codeRepos = codeRepos

      // Step 3: Resource repo selection
      void showRepoSelect(
        renderer,
        orgLogin,
        "Select Resource Repositories (resources/)",
        (resourceRepos) => {
          state.resourceRepos = resourceRepos

          // Step 4: Branch configuration — deferred one tick so the Enter keypress
          // that confirmed the second repo selection doesn't leak into branchConfig.
          const allRepos = [...codeRepos, ...resourceRepos]
          setTimeout(() => {
            showBranchConfig(renderer, allRepos, (branches) => {
              state.branches = branches

              // Step 5: Indexing prompt — deferred one tick so the Enter keypress
              // that confirmed branch config doesn't immediately fire ITEM_SELECTED
              // on the index prompt's SelectRenderable before the user sees it.
              setTimeout(() => {
                showIndexPrompt(renderer, (shouldIndex) => {
                  state.shouldIndex = shouldIndex

                  // Execute init
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
  const { appendLine, startThrottle, stopThrottle, container: execContainer } = showExecutingScreen(renderer)

  function onLine(line: string, _isStderr: boolean, isCarriageReturn: boolean): void {
    appendLine(line, false, isCarriageReturn)
  }

  try {
    // Step 1: Create .workbench/ directory
    appendLine("--- Creating .workbench/ directory ---", true)
    mkdirSync(".workbench", { recursive: true })
    appendLine("Created .workbench/")

    // Step 2: Add code submodules
    for (const repo of state.codeRepos) {
      const branch = state.branches.get(repo.name) ?? repo.defaultBranch
      const destPath = `projects/${repo.name}`

      appendLine(`--- Adding ${destPath} ---`, true)
      startThrottle()
      try {
        await runCommand("git", ["submodule", "add", repo.url, destPath], onLine)
      } finally {
        stopThrottle()
      }

      // Checkout/create branch
      appendLine(`--- Checking out branch ${branch} for ${repo.name} ---`, true)
      startThrottle()
      try {
        await runCommand("git", ["-C", destPath, "checkout", branch], onLine)
      } catch {
        // Branch doesn't exist remotely — create it locally
        await runCommand("git", ["-C", destPath, "checkout", "-b", branch], onLine)
      } finally {
        stopThrottle()
      }
    }

    // Step 3: Add resource submodules
    for (const repo of state.resourceRepos) {
      const branch = state.branches.get(repo.name) ?? repo.defaultBranch
      const destPath = `resources/${repo.name}`

      appendLine(`--- Adding ${destPath} ---`, true)
      startThrottle()
      try {
        await runCommand("git", ["submodule", "add", repo.url, destPath], onLine)
      } finally {
        stopThrottle()
      }

      // Checkout/create branch
      appendLine(`--- Checking out branch ${branch} for ${repo.name} ---`, true)
      startThrottle()
      try {
        await runCommand("git", ["-C", destPath, "checkout", branch], onLine)
      } catch {
        // Branch doesn't exist remotely — create it locally
        await runCommand("git", ["-C", destPath, "checkout", "-b", branch], onLine)
      } finally {
        stopThrottle()
      }
    }

    // Step 4: Write config
    appendLine("--- Writing .workbench/config.yaml ---", true)
    writeConfig(state.selectedOrg, state.codeRepos, state.resourceRepos, state.branches)
    appendLine("Config written successfully.")

    // Step 5: Optional indexing (non-fatal)
    if (state.shouldIndex) {
      appendLine("--- Running ck --index ---", true)
      const indexSpinner = createSpinner(renderer, "Indexing...")
      indexSpinner.start()
      let indexingStarted = false

      startThrottle()
      try {
        await runCommand("ck", ["--index"], (line, isStderr, isCR) => {
          if (!indexingStarted) {
            indexSpinner.stop()
            indexingStarted = true
          }
          appendLine(line, false, isCR)
        })
        appendLine("Indexing complete.")
      } catch (err) {
        indexSpinner.stop()
        appendLine(`Warning: ck --index failed: ${err}. Continuing...`)
      } finally {
        stopThrottle()
      }
    }

    appendLine(" ", false)
    appendLine("--- Init complete! Press any key to return to menu ---", true)

    // Wait for keypress then return to menu
    const keypressHandler = (_key: KeyEvent) => {
      renderer.keyInput.off("keypress", keypressHandler)
      execContainer.visible = false
      onComplete(true)
    }
    renderer.keyInput.on("keypress", keypressHandler)
  } catch (err) {
    appendLine(" ", false)
    appendLine(`--- Error: ${err} ---`, true)
    appendLine("Init aborted. Press any key to return to menu.", false)

    const keypressHandler = (_key: KeyEvent) => {
      renderer.keyInput.off("keypress", keypressHandler)
      execContainer.visible = false
      onComplete(false)
    }
    renderer.keyInput.on("keypress", keypressHandler)
  }
}
