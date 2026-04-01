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
  init: boolean
  noFork: boolean
  name: string
  noTui: boolean
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
      init: { type: "boolean", default: false },
      "no-fork": { type: "boolean", default: false },
      name: { type: "string", default: "workbench" },
      "no-tui": { type: "boolean", default: false },
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
    init: values.init,
    noFork: values["no-fork"] as boolean,
    name: values.name as string,
    noTui: values["no-tui"] as boolean,
  }
}

export function printHelp(): void {
  console.log(`workbench - Initialize a development workbench

USAGE:
  workbench --init [options]
  workbench --init --no-tui [options]
  workbench --org <name> --code-repository <url> [options]
  workbench --tui
  workbench --help

OPTIONS:
  --init                          Initialize a new workbench (fork & clone)
  --name <name>                   Name for the fork and local folder (default: workbench)
  --no-fork                       Clone without forking (read-only)
  --no-tui                        Skip TUI, use defaults or provided values
  --org <name>                    GitHub organization name
  --code-repository <url>         Code repository URL (can be repeated)
  --resource-repository <url>     Resource repository URL (can be repeated)
  --code-branch <name>            Branch for all code repositories (default: main)
  --resource-branch <name>        Branch for all resource repositories (default: main)
  --index <on|off>                Run indexing after init (default: on)
  --tui                           Launch interactive TUI mode
  --help                          Display this help message

EXAMPLES:
  workbench --init
  workbench --init --no-tui --name my-project
  workbench --init --no-tui --no-fork --name explore-wb
  workbench --init --no-tui --name my-project --org myorg --code-repository https://github.com/myorg/api
  workbench --org myorg --code-repository https://github.com/myorg/backend
  workbench --tui
`)
}
