import { parseArgs } from "node:util"
import { existsSync } from "node:fs"

export interface ParsedArgs {
  help: boolean
  tui: boolean
  org?: string
  codeRepositories: string[]
  resourceRepositories: string[]
  codeBranch: string
  resourceBranch: string
  index: boolean
}

const HELP_TEXT = `workbench - Initialize a development workbench

USAGE:
  workbench                           Show this help message
  workbench --help                    Show this help message
  workbench --tui                     Launch interactive TUI mode
  workbench --org <name> --code-repository <url> [options]

OPTIONS:
  --org <name>                        GitHub organization name (required)
  --code-repository <url>             Code repository URL (repeatable)
  --resource-repository <url>         Resource repository URL (repeatable)
  --code-branch <name>                Branch for all code repos (default: main)
  --resource-branch <name>            Branch for all resource repos (default: main)
  --index <on|off>                    Run indexing after init (default: on)
  --tui                               Launch interactive TUI mode
  --help                              Show this help message

EXAMPLES:
  workbench --tui
  workbench --org myorg --code-repository https://github.com/myorg/repo1
  workbench --org myorg --code-repository https://github.com/myorg/repo1 --code-repository https://github.com/myorg/repo2
  workbench --org myorg --code-repository https://github.com/myorg/code --resource-repository https://github.com/myorg/resources
  workbench --org myorg --code-repository https://github.com/myorg/repo --code-branch develop --index off
`

export function showHelp(): void {
  console.log(HELP_TEXT)
}

export function parseCliArgs(): ParsedArgs | null {
  const { values } = parseArgs({
    options: {
      help: { type: "boolean", default: false },
      tui: { type: "boolean", default: false },
      org: { type: "string" },
      "code-repository": { type: "string", multiple: true },
      "resource-repository": { type: "string", multiple: true },
      "code-branch": { type: "string", default: "main" },
      "resource-branch": { type: "string", default: "main" },
      index: { type: "string", default: "on" },
    },
    strict: false,
  })

  const codeRepositories = (values["code-repository"] as string[] | undefined) ?? []
  const resourceRepositories = (values["resource-repository"] as string[] | undefined) ?? []
  const indexValue = values.index as string

  return {
    help: values.help as boolean,
    tui: values.tui as boolean,
    org: values.org as string | undefined,
    codeRepositories,
    resourceRepositories,
    codeBranch: values["code-branch"] as string,
    resourceBranch: values["resource-branch"] as string,
    index: indexValue === "on",
  }
}

export function validateArgs(args: ParsedArgs): string | null {
  if (args.help || args.tui) {
    return null
  }

  if (!args.org) {
    return "organization is required (--org)"
  }

  if (args.codeRepositories.length === 0 && args.resourceRepositories.length === 0) {
    return "at least one repository required"
  }

  if (existsSync(".workbench")) {
    return ".workbench/ already exists"
  }

  return null
}
