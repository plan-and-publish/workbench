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

const SCREEN_ID = "init-org-select-screen"

export async function showInitOrgSelect(
  renderer: CliRenderer,
  preselectedOrg: string | undefined,
  title: string,
  onSelect: (orgLogin: string) => void
): Promise<void> {
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

  const spinner = createSpinner(renderer, "Loading organizations...")
  spinner.start()

  let orgs: GhOrg[]
  try {
    orgs = await getOrgs()
  } catch (err) {
    spinner.stop()
    const errText = new TextRenderable(renderer, {
      id: "init-org-error",
      content: `Error fetching orgs: ${err}`,
      fg: theme.tokens.error.fg,
    })
    container.add(errText)
    return
  }
  spinner.stop()

  const titleText = new TextRenderable(renderer, {
    id: "init-org-title",
    content: title,
    fg: theme.tokens.title.fg,
  })
  container.add(titleText)

  const hint = new TextRenderable(renderer, {
    id: "init-org-hint",
    content: "Type to filter | Tab to switch focus | Enter to select",
    fg: theme.tokens.subtitle.fg,
  })
  container.add(hint)

  const filterInput = new InputRenderable(renderer, {
    id: "init-org-filter",
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

  const defaultIndex = preselectedOrg
    ? allOptions.findIndex((o) => o.value === preselectedOrg)
    : 0

  const selectList = new SelectRenderable(renderer, {
    id: "init-org-select-list",
    width: 50,
    height: 15,
    options: allOptions,
    selectedIndex: defaultIndex >= 0 ? defaultIndex : 0,
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

  filterInput.focus()
}
