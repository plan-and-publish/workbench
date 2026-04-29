import {
  InputRenderable,
  TextRenderable,
  BoxRenderable,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core"
import { validateRepoName } from "../utils/gh.ts"
import { theme } from "../theme"

const SCREEN_ID = "init-name-input-screen"

export function showInitNameInput(
  renderer: CliRenderer,
  prefilledName: string,
  onConfirm: (name: string) => void
): void {
  const existing = renderer.root.getRenderable(SCREEN_ID)
  if (existing) {
    renderer.root.remove(SCREEN_ID)
  }

  const container = new BoxRenderable(renderer, {
    id: SCREEN_ID,
    flexDirection: "column",
    padding: 1,
  })

  const title = new TextRenderable(renderer, {
    id: "init-name-title",
    content: "Name Your Workbench",
    fg: theme.tokens.title.fg,
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "init-name-hint",
    content: "Enter a name (alphanumeric, -, ., _) | Enter to confirm",
    fg: theme.tokens.subtitle.fg,
  })
  container.add(hint)

  const nameInput = new InputRenderable(renderer, {
    id: "init-name-input",
    width: 50,
    value: prefilledName,
    backgroundColor: theme.tokens.input.background,
    textColor: theme.tokens.input.text.fg,
    focusedBackgroundColor: theme.tokens.input.focusedBackground,
  })

  const errorText = new TextRenderable(renderer, {
    id: "init-name-error",
    content: "",
    fg: theme.tokens.error.fg,
  })
  errorText.visible = false

  container.add(nameInput)
  container.add(errorText)
  renderer.root.add(container)

  const keypressHandler = (key: KeyEvent) => {
    if (key.name === "return" || key.name === "enter") {
      const name = nameInput.value.trim()
      if (!validateRepoName(name)) {
        errorText.content = `Invalid name "${name}". Use only alphanumeric characters, hyphens, dots, and underscores.`
        errorText.visible = true
        return
      }
      renderer.keyInput.off("keypress", keypressHandler)
      container.visible = false
      onConfirm(name)
    }
  }

  renderer.keyInput.on("keypress", keypressHandler)

  nameInput.focus()
}
