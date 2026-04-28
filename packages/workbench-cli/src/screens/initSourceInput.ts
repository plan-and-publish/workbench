import {
  InputRenderable,
  TextRenderable,
  BoxRenderable,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core"
import { theme } from "../theme"

const SCREEN_ID = "source-input-screen"

export function showSourceInput(
  renderer: CliRenderer,
  prefilledSource: string,
  onConfirm: (source: string) => void
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
    id: "source-input-title",
    content: "Source Repository",
    fg: theme.tokens.title.fg,
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "source-input-hint",
    content: "Enter source repo (owner/repo or URL) | Enter to confirm",
    fg: theme.tokens.subtitle.fg,
  })
  container.add(hint)

  const sourceInput = new InputRenderable(renderer, {
    id: "source-input-field",
    width: 50,
    value: prefilledSource,
    backgroundColor: theme.tokens.input.background,
    textColor: theme.tokens.input.text.fg,
    focusedBackgroundColor: theme.tokens.input.focusedBackground,
  })

  const errorText = new TextRenderable(renderer, {
    id: "source-input-error",
    content: "",
    fg: theme.tokens.error.fg,
  })
  errorText.visible = false

  container.add(sourceInput)
  container.add(errorText)
  renderer.root.add(container)

  const keypressHandler = (key: KeyEvent) => {
    if (key.name === "return" || key.name === "enter") {
      const source = sourceInput.value.trim()
      if (source.length === 0) {
        errorText.content = "Source cannot be empty"
        errorText.visible = true
        return
      }
      renderer.keyInput.off("keypress", keypressHandler)
      container.visible = false
      onConfirm(source)
    }
  }

  renderer.keyInput.on("keypress", keypressHandler)

  sourceInput.focus()
}
