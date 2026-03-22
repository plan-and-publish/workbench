import {
  TextRenderable,
  TextAttributes,
  BoxRenderable,
  ScrollBoxRenderable,
  type CliRenderer,
} from "@opentui/core"

const SCREEN_ID = "executing-screen"

export interface ExecutingScreen {
  appendLine: (line: string, isHeader?: boolean) => void
  container: BoxRenderable
}

let lineCount = 0

export function showExecutingScreen(renderer: CliRenderer): ExecutingScreen {
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
    id: "executing-title",
    content: "Executing init...",
    fg: "#00FFFF",
  })
  container.add(title)

  const scrollBox = new ScrollBoxRenderable(renderer, {
    id: "executing-output",
    width: 100,
    height: 30,
    stickyScroll: true,
    stickyStart: "bottom",
  })

  container.add(scrollBox)
  renderer.root.add(container)

  function appendLine(line: string, isHeader = false): void {
    lineCount++
    const textNode = new TextRenderable(renderer, {
      id: `exec-line-${lineCount}`,
      content: line || " ",
      fg: isHeader ? "#FFFFFF" : "#666666",
      attributes: isHeader ? TextAttributes.BOLD : TextAttributes.DIM,
    })
    scrollBox.add(textNode)
    // Scroll to bottom — use scrollTo with a very large number
    scrollBox.scrollTo(999999)
  }

  return { appendLine, container }
}
