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
import { getRepos, type GhRepo } from "../utils/gh.ts"

const SCREEN_ID = "repo-select-screen"

export interface Repo {
  name: string
  url: string
  defaultBranch: string
}

export function showRepoSelect(
  renderer: CliRenderer,
  orgLogin: string,
  stepTitle: string,
  onConfirm: (repos: Repo[]) => void
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
    id: "repo-loading",
    content: `Fetching repositories for ${orgLogin}...`,
    fg: "#888888",
  })
  container.add(loadingText)
  renderer.root.add(container)

  // Fetch repos
  let repos: GhRepo[]
  try {
    repos = getRepos(orgLogin)
  } catch (err) {
    loadingText.content = `Error fetching repos: ${err}`
    return
  }

  container.remove("repo-loading")

  // Title
  const title = new TextRenderable(renderer, {
    id: "repo-title",
    content: stepTitle,
    fg: "#00FFFF",
  })
  container.add(title)

  const hint = new TextRenderable(renderer, {
    id: "repo-hint",
    content: "Space to toggle | Tab to switch filter/list | Enter to confirm",
    fg: "#888888",
  })
  container.add(hint)

  // Filter input
  const filterInput = new InputRenderable(renderer, {
    id: "repo-filter",
    width: 60,
    placeholder: "Type to filter...",
    backgroundColor: "#1a1a1a",
    textColor: "#FFFFFF",
    focusedBackgroundColor: "#2a2a2a",
  })

  const selected = new Set<number>() // indices into repos array

  // Current filtered repo indices
  let filteredIndices: number[] = repos.map((_, i) => i)

  function buildOptions(): { name: string; description: string; value: number }[] {
    return filteredIndices.map((repoIdx) => ({
      name: `${selected.has(repoIdx) ? "[x]" : "[ ]"} ${repos[repoIdx].name}`,
      description: repos[repoIdx].url,
      value: repoIdx,
    }))
  }

  const selectList = new SelectRenderable(renderer, {
    id: "repo-select-list",
    width: 60,
    height: 15,
    options: buildOptions(),
    selectedIndex: 0,
  })

  filterInput.on(InputRenderableEvents.CHANGE, (value: string) => {
    filteredIndices = repos.reduce<number[]>((acc, r, i) => {
      if (r.name.toLowerCase().includes(value.toLowerCase())) acc.push(i)
      return acc
    }, [])
    selectList.options = buildOptions()
  })

  let listFocused = false

  const keypressHandler = (key: KeyEvent) => {
    if (key.name === "space" && listFocused) {
      const currentIdx = selectList.getSelectedIndex()
      const currentOpts = selectList.options as Array<{ value: number }>
      if (currentIdx >= 0 && currentIdx < currentOpts.length) {
        const repoIdx = currentOpts[currentIdx].value
        if (selected.has(repoIdx)) {
          selected.delete(repoIdx)
        } else {
          selected.add(repoIdx)
        }
        selectList.options = buildOptions()
        selectList.selectedIndex = currentIdx
      }
    } else if (key.name === "tab") {
      if (!listFocused) {
        filterInput.blur()
        selectList.focus()
        listFocused = true
      } else {
        selectList.blur()
        filterInput.focus()
        listFocused = false
      }
    } else if ((key.name === "return" || key.name === "enter") && listFocused) {
      renderer.keyInput.off("keypress", keypressHandler)
      const chosenRepos = repos
        .filter((_, i) => selected.has(i))
        .map((r) => ({
          name: r.name,
          url: r.url,
          defaultBranch: r.defaultBranch,
        }))
      container.visible = false
      onConfirm(chosenRepos)
    }
  }

  renderer.keyInput.on("keypress", keypressHandler)

  container.add(filterInput)
  container.add(selectList)

  filterInput.focus()
}
