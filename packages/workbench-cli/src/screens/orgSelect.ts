import {
  SelectRenderable,
  SelectRenderableEvents,
  InputRenderable,
  InputRenderableEvents,
  TextRenderable,
  BoxRenderable,
  type CliRenderer,
} from "@opentui/core"
import { getOrgs, type GhOrg } from "../utils/gh.ts"

const SCREEN_ID = "org-select-screen"

export function showOrgSelect(
  renderer: CliRenderer,
  onSelect: (orgLogin: string) => void
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

  const loadingText = new TextRenderable(renderer, {
    id: "org-loading",
    content: "Fetching organizations...",
    fg: "#888888",
  })
  container.add(loadingText)
  renderer.root.add(container)

  // Fetch orgs (blocking, behind loading text)
  let orgs: GhOrg[]
  try {
    orgs = getOrgs()
  } catch (err) {
    loadingText.content = `Error fetching orgs: ${err}`
    return
  }

  // Remove loading text
  container.remove("org-loading")

  // Title
  const title = new TextRenderable(renderer, {
    id: "org-title",
    content: "Select GitHub Organization",
    fg: "#00FFFF",
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "org-hint",
    content: "Type to filter | Tab to switch focus | Enter to select",
    fg: "#888888",
  })
  container.add(hint)

  // Filter input
  const filterInput = new InputRenderable(renderer, {
    id: "org-filter",
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

  selectList.on(
    SelectRenderableEvents.ITEM_SELECTED,
    (_index: number, option: { value: string }) => {
      container.visible = false
      onSelect(option.value)
    }
  )

  container.add(filterInput)
  container.add(selectList)

  filterInput.focus()
}
