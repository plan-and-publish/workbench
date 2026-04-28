import {
  InputRenderable,
  InputRenderableEvents,
  TextRenderable,
  BoxRenderable,
  ScrollBoxRenderable,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core"
import type { Repo } from "./repoSelect.ts"
import { theme } from "../theme"

const SCREEN_ID = "branch-config-screen"

export function showBranchConfig(
  renderer: CliRenderer,
  repos: Repo[],
  onConfirm: (branches: Map<string, string>) => void
): void {
  // Remove any existing screen
  const existing = renderer.root.getRenderable(SCREEN_ID)
  if (existing) {
    renderer.root.remove(SCREEN_ID)
  }

  const container = new BoxRenderable(renderer, {
    id: SCREEN_ID,
    flexDirection: "column",
    padding: 1,
  })

  // Title
  const title = new TextRenderable(renderer, {
    id: "branch-title",
    content: "Configure Branches",
    fg: theme.tokens.title.fg,
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "branch-hint",
    content: "Tab to navigate between rows | Enter on last row to continue",
    fg: theme.tokens.subtitle.fg,
  })
  container.add(hint)

  // Track input values
  const inputValues: string[] = repos.map((r) => r.defaultBranch)
  // Collect input renderables for focus management
  const inputs: InputRenderable[] = []

  const scrollBox = new ScrollBoxRenderable(renderer, {
    id: "branch-scroll",
    width: 70,
    height: 20,
    stickyScroll: false,
  })

  repos.forEach((repo, i) => {
    const row = new BoxRenderable(renderer, {
      id: `branch-row-${i}`,
      flexDirection: "row",
      marginBottom: 1,
    })

    const nameText = new TextRenderable(renderer, {
      id: `branch-name-${i}`,
      content: repo.name.substring(0, 34).padEnd(35),
      width: 35,
      fg: theme.tokens.output.header.fg,
    })

    const branchInput = new InputRenderable(renderer, {
      id: `branch-input-${i}`,
      width: 25,
      value: repo.defaultBranch,
      backgroundColor: theme.tokens.input.background,
      textColor: theme.tokens.input.text.fg,
      focusedBackgroundColor: theme.tokens.input.focusedBackground,
    })

    branchInput.on(InputRenderableEvents.CHANGE, (value: string) => {
      inputValues[i] = value
    })

    inputs.push(branchInput)
    row.add(nameText)
    row.add(branchInput)
    scrollBox.add(row)
  })

  container.add(scrollBox)
  renderer.root.add(container)

  // Early exit: no repos selected — skip branch config entirely
  if (inputs.length === 0) {
    onConfirm(new Map())
    return
  }

  let focusIndex = 0

  const keypressHandler = (key: KeyEvent) => {
    if (key.name === "tab") {
      inputs[focusIndex].blur()
      focusIndex = (focusIndex + 1) % inputs.length
      inputs[focusIndex].focus()
    } else if (key.name === "return" || key.name === "enter") {
      if (focusIndex === inputs.length - 1) {
        renderer.keyInput.off("keypress", keypressHandler)
        const branches = new Map<string, string>()
        repos.forEach((repo, i) => {
          branches.set(repo.name, inputValues[i])
        })
        container.visible = false
        onConfirm(branches)
      }
    }
  }

  renderer.keyInput.on("keypress", keypressHandler)

  // focus() called after renderer.root.add(container) — required by opentui
  inputs[0].focus()
}
