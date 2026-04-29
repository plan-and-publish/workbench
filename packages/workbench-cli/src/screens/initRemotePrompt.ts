import {
  SelectRenderable,
  SelectRenderableEvents,
  TextRenderable,
  BoxRenderable,
  type CliRenderer,
} from "@opentui/core"
import { theme } from "../theme"

const SCREEN_ID = "remote-prompt-screen"

export function showRemotePrompt(
  renderer: CliRenderer,
  onAnswer: (shouldCreateRemote: boolean) => void
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
    id: "remote-prompt-title",
    content: "Set up a remote?",
    fg: theme.tokens.title.fg,
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "remote-prompt-hint",
    content: "A private repo will be created on GitHub and set as origin",
    fg: theme.tokens.subtitle.fg,
  })
  container.add(hint)

  const options = [
    { name: "yes", description: "Create a private GitHub repository", value: "yes" },
    { name: "no", description: "Add a remote manually later", value: "no" },
  ]

  const select = new SelectRenderable(renderer, {
    id: "remote-prompt-select",
    width: 40,
    height: 4,
    options,
    selectedIndex: 1,
  })

  select.on(
    SelectRenderableEvents.ITEM_SELECTED,
    (_index: number, option: { value: string }) => {
      container.visible = false
      onAnswer(option.value === "yes")
    }
  )

  container.add(select)
  renderer.root.add(container)
  select.focus()
}
