import {
  SelectRenderable,
  SelectRenderableEvents,
  TextRenderable,
  BoxRenderable,
  type CliRenderer,
} from "@opentui/core"

const SCREEN_ID = "index-prompt-screen"

export function showIndexPrompt(
  renderer: CliRenderer,
  onAnswer: (shouldIndex: boolean) => void
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

  const title = new TextRenderable(renderer, {
    id: "index-title",
    content: "Index the repository after setup?",
    fg: "#00FFFF",
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "index-hint",
    content: "Running ck --index may take a few minutes",
    fg: "#888888",
  })
  container.add(hint)

  const options = [
    { name: "yes", description: "Run ck --index after setup", value: "yes" },
    { name: "no", description: "Skip indexing", value: "no" },
  ]

  const select = new SelectRenderable(renderer, {
    id: "index-select",
    width: 40,
    height: 4,
    options,
    selectedIndex: 0,
  })

  select.on(
    SelectRenderableEvents.ITEM_SELECTED,
    (_index: number, option: { value: string }) => {
      container.visible = false
      onAnswer(option.value === "yes")
    }
  )

  select.focus()
  container.add(select)
  renderer.root.add(container)
}
