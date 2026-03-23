import { spawn } from "child_process"

export type LineHandler = (line: string, isStderr: boolean, isCarriageReturn: boolean) => void

// Split a buffer on any line ending.
// Returns an array of [lineContent, isCarriageReturn] pairs, plus the unfinished tail.
// Priority: \r\n first, then bare \r, then \n — ensures \r\n is not split into two events.
function splitLines(buf: string): [Array<[string, boolean]>, string] {
  const result: Array<[string, boolean]> = []
  const re = /([^\r\n]*)(\r\n|\r|\n)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(buf)) !== null) {
    result.push([match[1], match[2] === "\r"])
    lastIndex = re.lastIndex
  }
  return [result, buf.slice(lastIndex)]
}

export function runCommand(
  cmd: string,
  args: string[],
  onLine: LineHandler
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: false })
    let stdoutBuf = ""
    let stderrBuf = ""

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString()
      const [lines, remainder] = splitLines(stdoutBuf)
      stdoutBuf = remainder
      for (const [line, isCR] of lines) onLine(line, false, isCR)
    })

    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString()
      const [lines, remainder] = splitLines(stderrBuf)
      stderrBuf = remainder
      for (const [line, isCR] of lines) onLine(line, true, isCR)
    })

    child.on("close", (code) => {
      // Flush any remaining partial line — never \r-terminated (no terminator present)
      if (stdoutBuf) onLine(stdoutBuf, false, false)
      if (stderrBuf) onLine(stderrBuf, true, false)
      if (code === 0) resolve()
      else reject(new Error(`Command failed with exit code ${code}`))
    })

    child.on("error", reject)
  })
}
