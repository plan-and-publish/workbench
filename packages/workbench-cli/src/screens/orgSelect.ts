import {
  SelectRenderable,
  SelectRenderableEvents,
  InputRenderable,
  InputRenderableEvents,
  TextRenderable,
  BoxRenderable,
  type CliRenderer,
  type KeyEvent,
} from "@opentui/core"
import { getOrgs, type GhOrg } from "../utils/gh.ts"
import { createSpinner } from "../utils/spinner.ts"
import { theme } from "../theme"

const SCREEN_ID = "org-select-screen"

export async function showOrgSelect(
  renderer: CliRenderer,
  onSelect: (orgLogin: string) => void
): Promise<void> {
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
  renderer.root.add(container)

  // Spinner replaces loadingText — added AFTER container so it renders below
  const spinner = createSpinner(renderer, "Loading organizations...")
  spinner.start()

  let orgs: GhOrg[]
  try {
    orgs = await getOrgs()
  } catch (err) {
    spinner.stop()
    const errText = new TextRenderable(renderer, {
      id: "org-error",
      content: `Error fetching orgs: ${err}`,
      fg: theme.tokens.error.fg,
    })
    container.add(errText)
    return
  }
  spinner.stop()

  // Title
  const title = new TextRenderable(renderer, {
    id: "org-title",
    content: "Select GitHub Organization",
    fg: theme.tokens.title.fg,
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "org-hint",
    content: "Type to filter | Tab to switch focus | Enter to select",
    fg: theme.tokens.subtitle.fg,
  })
  container.add(hint)

  // Filter input
  const filterInput = new InputRenderable(renderer, {
    id: "org-filter",
    width: 50,
    placeholder: "Type to filter...",
    backgroundColor: theme.tokens.input.background,
    textColor: theme.tokens.input.text.fg,
    focusedBackgroundColor: theme.tokens.input.focusedBackground,
  })

  const allOptions = orgs.map((o) => ({
    name: o.login,
    description: o.description || "",
    value: o.login,
  }))

  const selectList = new SelectRenderable(renderer, {
    id: "org-select-list",
    width: 50,
    height: 15,
    options: allOptions,
    selectedIndex: 0,
  })

  filterInput.on(InputRenderableEvents.CHANGE, (value: string) => {
    const filtered = allOptions.filter((o) =>
      o.name.toLowerCase().includes(value.toLowerCase())
    )
    selectList.options = filtered.length > 0 ? filtered : allOptions
  })

  let listFocused = false

  const keypressHandler = (key: KeyEvent) => {
    if (key.name === "tab") {
      if (!listFocused) {
        filterInput.blur()
        selectList.focus()
        listFocused = true
      } else {
        selectList.blur()
        filterInput.focus()
        listFocused = false
      }
    }
  }

  selectList.on(
    SelectRenderableEvents.ITEM_SELECTED,
    (_index: number, option: { value: string }) => {
      renderer.keyInput.off("keypress", keypressHandler)
      container.visible = false
      onSelect(option.value)
    }
  )

  container.add(filterInput)
  container.add(selectList)

  renderer.keyInput.on("keypress", keypressHandler)

  // focus() called last — after container is in the tree and all children added
  filterInput.focus()
}
