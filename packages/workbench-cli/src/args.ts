import { parseArgs } from "node:util"

export interface CliArgs {
  help: boolean
  tui: boolean
  org?: string
  codeRepositories: string[]
  resourceRepositories: string[]
  codeBranch: string
  resourceBranch: string
  index: boolean
}

export function parseCliArgs(): CliArgs {
  const { values } = parseArgs({
    options: {
      help: { type: "boolean", default: false },
      tui: { type: "boolean", default: false },
      org: { type: "string" },
      "code-repository": { type: "string", multiple: true, default: [] },
      "resource-repository": { type: "string", multiple: true, default: [] },
      "code-branch": { type: "string", default: "main" },
      "resource-branch": { type: "string", default: "main" },
      index: { type: "string", default: "on" },
    },
    strict: true,
    allowPositionals: false,
  })

  return {
    help: values.help,
    tui: values.tui,
    org: values.org,
    codeRepositories: values["code-repository"] as string[],
    resourceRepositories: values["resource-repository"] as string[],
    codeBranch: values["code-branch"] as string,
    resourceBranch: values["resource-branch"] as string,
    index: values.index === "on",
  }
}

export function printHelp(): void {
  console.log(`workbench - Initialize a development workbench

USAGE:
  workbench --org <name> --code-repository <url> [--code-repository <url>...] [options]
  workbench --org <name> --resource-repository <url> [--resource-repository <url>...] [options]
  workbench --tui
  workbench --help

OPTIONS:
  --org <name>                    GitHub organization name (required for non-interactive)
  --code-repository <url>         Code repository URL (can be repeated)
  --resource-repository <url>     Resource repository URL (can be repeated)
  --code-branch <name>            Branch for all code repositories (default: main)
  --resource-branch <name>        Branch for all resource repositories (default: main)
  --index <on|off>                Run indexing after init (default: on)
  --tui                           Launch interactive TUI mode
  --help                          Display this help message

EXAMPLES:
  workbench --org myorg --code-repository https://github.com/myorg/backend

  workbench --org myorg --code-repository https://github.com/myorg/api \\
                       --code-repository https://github.com/myorg/web \\
                       --resource-repository https://github.com/myorg/docs \\
                       --code-branch develop --index off

  workbench --tui
`)
}
