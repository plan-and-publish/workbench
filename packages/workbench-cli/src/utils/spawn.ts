import { spawn } from "child_process"

export type LineHandler = (line: string, isStderr: boolean) => void

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
      const lines = stdoutBuf.split("\n")
      stdoutBuf = lines.pop() ?? ""
      for (const line of lines) onLine(line, false)
    })

    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString()
      const lines = stderrBuf.split("\n")
      stderrBuf = lines.pop() ?? ""
      for (const line of lines) onLine(line, true)
    })

    child.on("close", (code) => {
      if (stdoutBuf) onLine(stdoutBuf, false)
      if (stderrBuf) onLine(stderrBuf, true)
      if (code === 0) resolve()
      else reject(new Error(`Command failed with exit code ${code}`))
    })

    child.on("error", reject)
  })
}
