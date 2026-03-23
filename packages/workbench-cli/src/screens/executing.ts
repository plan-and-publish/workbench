import {
  TextRenderable,
  TextAttributes,
  BoxRenderable,
  ScrollBoxRenderable,
  type CliRenderer,
} from "@opentui/core"

const SCREEN_ID = "executing-screen"

interface BufferedLine {
  line: string
  isHeader: boolean
  isCarriageReturn: boolean
}

export interface ExecutingScreen {
  appendLine: (line: string, isHeader?: boolean, isCarriageReturn?: boolean) => void
  startThrottle: () => void
  stopThrottle: () => void
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

  // Tracks the last rendered node for in-place \r replacement
  let lastTextNode: TextRenderable | null = null
  let lastWasCarriageReturn = false

  // 1-second throttle buffer
  let lineBuffer: BufferedLine[] = []
  let flushInterval: ReturnType<typeof setInterval> | null = null

  // Render a single line immediately (called only from flushBuffer)
  function renderLine(line: string, isHeader: boolean, isCarriageReturn: boolean): void {
    if (isCarriageReturn && lastWasCarriageReturn && lastTextNode !== null) {
      // In-place update: reuse the existing node, just update its content
      lastTextNode.content = line || " "
    } else {
      lineCount++
      const textNode = new TextRenderable(renderer, {
        id: `exec-line-${lineCount}`,
        content: line || " ",
        fg: isHeader ? "#FFFFFF" : "#666666",
        attributes: isHeader ? TextAttributes.BOLD : TextAttributes.DIM,
      })
      scrollBox.add(textNode)
      scrollBox.scrollTo(999999)
      lastTextNode = textNode
    }
    lastWasCarriageReturn = isCarriageReturn
  }

  function flushBuffer(): void {
    if (lineBuffer.length === 0) return
    const toFlush = lineBuffer
    lineBuffer = []
    for (const { line, isHeader, isCarriageReturn } of toFlush) {
      renderLine(line, isHeader, isCarriageReturn)
    }
  }

  // Public API: buffer a line. Consecutive \r lines are coalesced — only the
  // last value is kept since earlier values would be immediately overwritten.
  // Header lines and lines outside an active throttle are rendered immediately.
  function appendLine(line: string, isHeader = false, isCarriageReturn = false): void {
    // Render immediately when no throttle is active (e.g. status lines between
    // runCommand calls) or when this is a header/separator line — these are
    // infrequent and should appear instantly, not be held for up to 1 second.
    if (flushInterval === null || isHeader) {
      flushBuffer() // flush any pending buffered output first (maintain order)
      renderLine(line, isHeader, isCarriageReturn)
      return
    }
    if (
      isCarriageReturn &&
      lineBuffer.length > 0 &&
      lineBuffer[lineBuffer.length - 1].isCarriageReturn
    ) {
      lineBuffer[lineBuffer.length - 1] = { line, isHeader, isCarriageReturn }
    } else {
      lineBuffer.push({ line, isHeader, isCarriageReturn })
    }
  }

  function startThrottle(): void {
    if (flushInterval !== null) return
    flushInterval = setInterval(flushBuffer, 1000)
  }

  function stopThrottle(): void {
    if (flushInterval !== null) {
      clearInterval(flushInterval)
      flushInterval = null
    }
    flushBuffer() // Final flush — drain any lines buffered since the last tick
  }

  return { appendLine, startThrottle, stopThrottle, container }
}
