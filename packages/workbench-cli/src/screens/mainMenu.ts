import {
  SelectRenderable,
  SelectRenderableEvents,
  TextRenderable,
  BoxRenderable,
  type CliRenderer,
} from "@opentui/core"
import { theme } from "../theme"

export interface MainMenuCallbacks {
  onInit: () => void
  onExit: () => void
}

const SCREEN_ID = "main-menu-screen"

export function showMainMenu(
  renderer: CliRenderer,
  isInitialized: boolean,
  callbacks: MainMenuCallbacks
): void {
  // Remove any existing screen
  const existing = renderer.root.getRenderable(SCREEN_ID)
  if (existing) {
    existing.visible = false
    renderer.root.remove(SCREEN_ID)
  }

  const container = new BoxRenderable(renderer, {
    id: SCREEN_ID,
    flexDirection: "column",
    padding: 1,
  })

  // Title
  const title = new TextRenderable(renderer, {
    id: "menu-title",
    content: "workbench",
    fg: theme.tokens.title.fg,
  })
  container.add(title)

  const subtitle = new TextRenderable(renderer, {
    id: "menu-subtitle",
    content: "Select a command:",
    fg: theme.tokens.subtitle.fg,
  })
  container.add(subtitle)

  const spacer = new TextRenderable(renderer, {
    id: "menu-spacer",
    content: " ",
  })
  container.add(spacer)

  // Build options
  const initLabel = isInitialized ? "init (already initialized)" : "init"
  const initDescription = isInitialized
    ? "Workbench already initialized"
    : "Initialize workbench repository"

  const options = [
    { name: initLabel, description: initDescription, value: "init" },
    { name: "exit", description: "Quit the application", value: "exit" },
  ]

  const menu = new SelectRenderable(renderer, {
    id: "main-menu-select",
    width: 50,
    height: 6,
    options,
    selectedIndex: 0,
  })

  menu.on(SelectRenderableEvents.ITEM_SELECTED, (index: number) => {
    if (index === 0) {
      // init
      if (isInitialized) {
        // Show "already initialized" message for ~2 seconds
        showAlreadyInitializedMessage(renderer, container)
      } else {
        container.visible = false
        callbacks.onInit()
      }
    } else if (index === 1) {
      // exit
      callbacks.onExit()
    }
  })

  menu.focus()
  container.add(menu)
  renderer.root.add(container)
}

function showAlreadyInitializedMessage(renderer: CliRenderer, container: BoxRenderable): void {
  const msgId = "already-init-msg"
  const existing = container.getRenderable(msgId)
  if (existing) return // Already showing

  const msg = new TextRenderable(renderer, {
    id: msgId,
    content: "Already initialized. Remove .workbench/config.yaml to re-init.",
    fg: theme.tokens.warning.fg,
  })
  container.add(msg)

  setTimeout(() => {
    container.remove(msgId)
  }, 2000)
}
