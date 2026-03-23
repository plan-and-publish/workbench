import { dump } from "js-yaml"
import { writeFileSync, mkdirSync } from "fs"
import type { Repo } from "../screens/repoSelect.ts"

interface WorkbenchConfig {
  github: { org: string }
  codes: Array<Record<string, { url: string; branch: string }>>
  resources: Array<Record<string, { url: string; branch: string }>>
}

export function writeConfig(
  org: string,
  codeRepos: Repo[],
  resourceRepos: Repo[],
  branches: Map<string, string>
): void {
  const config: WorkbenchConfig = {
    github: { org },
    codes: codeRepos.map((r) => ({
      [r.name]: { url: r.url, branch: branches.get(r.name) ?? r.defaultBranch },
    })),
    resources: resourceRepos.map((r) => ({
      [r.name]: { url: r.url, branch: branches.get(r.name) ?? r.defaultBranch },
    })),
  }

  mkdirSync(".workbench", { recursive: true })
  writeFileSync(".workbench/config.yaml", dump(config))
}
