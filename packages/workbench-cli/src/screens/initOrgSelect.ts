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

const SCREEN_ID = "init-org-select-screen"

export async function showInitOrgSelect(
  renderer: CliRenderer,
  preselectedOrg: string | undefined,
  onSelect: (orgLogin: string, isPersonalAccount: boolean) => void
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
      fg: "#FF4444",
    })
    container.add(errText)
    return
  }
  spinner.stop()

  const title = new TextRenderable(renderer, {
    id: "init-org-title",
    content: "Select Fork Target",
    fg: "#00FFFF",
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "init-org-hint",
    content: "Type to filter | Tab to switch focus | Enter to select",
    fg: "#888888",
  })
  container.add(hint)

  const filterInput = new InputRenderable(renderer, {
    id: "init-org-filter",
    width: 50,
    placeholder: "Type to filter...",
    backgroundColor: "#1a1a1a",
    textColor: "#FFFFFF",
    focusedBackgroundColor: "#2a2a2a",
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
      const selectedOrg = orgs.find((o) => o.login === option.value)
      const isPersonalAccount = selectedOrg?.description === "Personal account"
      onSelect(option.value, isPersonalAccount)
    }
  )

  container.add(filterInput)
  container.add(selectList)

  renderer.keyInput.on("keypress", keypressHandler)

  filterInput.focus()
}
