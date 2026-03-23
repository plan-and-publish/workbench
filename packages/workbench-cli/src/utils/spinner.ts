import { TextRenderable, type CliRenderer } from "@opentui/core"

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export interface Spinner {
  start(): void
  stop(): void
}

export function createSpinner(renderer: CliRenderer, label: string): Spinner {
  const node = new TextRenderable(renderer, {
    id: `spinner-${Date.now()}`,
    content: `${FRAMES[0]} ${label}`,
    fg: "#00FFFF",
  })
  node.visible = false
  renderer.root.add(node)

  let frameIndex = 0
  let intervalId: ReturnType<typeof setInterval> | null = null

  return {
    start() {
      if (intervalId !== null) return
      frameIndex = 0
      node.visible = true
      node.content = `${FRAMES[frameIndex]} ${label}`
      intervalId = setInterval(() => {
        frameIndex = (frameIndex + 1) % FRAMES.length
        node.content = `${FRAMES[frameIndex]} ${label}`
      }, 100)
    },
    stop() {
      if (intervalId !== null) {
        clearInterval(intervalId)
        intervalId = null
      }
      node.visible = false
      renderer.root.remove(node.id)
    },
  }
}
