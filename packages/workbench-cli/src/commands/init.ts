import { type CliRenderer, type KeyEvent } from "@opentui/core"
import { showOrgSelect } from "../screens/orgSelect.ts"
import { showRepoSelect, type Repo } from "../screens/repoSelect.ts"
import { showBranchConfig } from "../screens/branchConfig.ts"
import { showIndexPrompt } from "../screens/indexPrompt.ts"
import { showExecutingScreen } from "../screens/executing.ts"
import { runCommand } from "../utils/spawn.ts"
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
  showOrgSelect(renderer, (orgLogin) => {
    state.selectedOrg = orgLogin

    // Step 2: Code repo selection
    showRepoSelect(renderer, orgLogin, "Select Code Repositories (projects/)", (codeRepos) => {
      state.codeRepos = codeRepos

      // Step 3: Resource repo selection
      showRepoSelect(
        renderer,
        orgLogin,
        "Select Resource Repositories (resources/)",
        (resourceRepos) => {
          state.resourceRepos = resourceRepos

          // Step 4: Branch configuration
          const allRepos = [...codeRepos, ...resourceRepos]
          showBranchConfig(renderer, allRepos, (branches) => {
            state.branches = branches

            // Step 5: Indexing prompt
            showIndexPrompt(renderer, (shouldIndex) => {
              state.shouldIndex = shouldIndex

              // Execute init
              void runInit(renderer, state as InitState, onComplete)
            })
          })
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
  const { appendLine, container: execContainer } = showExecutingScreen(renderer)

  function onLine(line: string, _isStderr: boolean): void {
    appendLine(line)
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
      await runCommand("git", ["submodule", "add", repo.url, destPath], onLine)

      // Checkout/create branch
      appendLine(`--- Checking out branch ${branch} for ${repo.name} ---`, true)
      try {
        await runCommand("git", ["-C", destPath, "checkout", branch], onLine)
      } catch {
        // Branch doesn't exist remotely — create it locally
        await runCommand("git", ["-C", destPath, "checkout", "-b", branch], onLine)
      }
    }

    // Step 3: Add resource submodules
    for (const repo of state.resourceRepos) {
      const branch = state.branches.get(repo.name) ?? repo.defaultBranch
      const destPath = `resources/${repo.name}`

      appendLine(`--- Adding ${destPath} ---`, true)
      await runCommand("git", ["submodule", "add", repo.url, destPath], onLine)

      // Checkout/create branch
      appendLine(`--- Checking out branch ${branch} for ${repo.name} ---`, true)
      try {
        await runCommand("git", ["-C", destPath, "checkout", branch], onLine)
      } catch {
        await runCommand("git", ["-C", destPath, "checkout", "-b", branch], onLine)
      }
    }

    // Step 4: Write config
    appendLine("--- Writing .workbench/config.yaml ---", true)
    writeConfig(state.selectedOrg, state.codeRepos, state.resourceRepos, state.branches)
    appendLine("Config written successfully.")

    // Step 5: Optional indexing (non-fatal)
    if (state.shouldIndex) {
      appendLine("--- Running ck --index ---", true)
      try {
        await runCommand("ck", ["--index"], onLine)
        appendLine("Indexing complete.")
      } catch (err) {
        appendLine(`Warning: ck --index failed: ${err}. Continuing...`)
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
