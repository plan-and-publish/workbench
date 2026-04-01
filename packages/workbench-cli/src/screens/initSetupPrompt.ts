import {
  SelectRenderable,
  SelectRenderableEvents,
  TextRenderable,
  BoxRenderable,
  type CliRenderer,
} from "@opentui/core"

const SCREEN_ID = "init-setup-prompt-screen"

export function showInitSetupPrompt(
  renderer: CliRenderer,
  onAnswer: (shouldSetup: boolean) => void
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
    id: "init-setup-title",
    content: "Set up your workbench now?",
    fg: "#00FFFF",
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "init-setup-hint",
    content: "Running setup configures git submodules for your project",
    fg: "#888888",
  })
  container.add(hint)

  const options = [
    { name: "yes", description: "Run the setup wizard", value: "yes" },
    { name: "no", description: "Set up later with workbench --tui", value: "no" },
  ]

  const select = new SelectRenderable(renderer, {
    id: "init-setup-select",
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

  container.add(select)
  renderer.root.add(container)
  select.focus()
}
