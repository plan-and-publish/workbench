import { execSync } from "child_process"
import { existsSync } from "fs"
import { join } from "path"

export interface GhOrg {
  login: string
  description: string
}

export interface GhRepo {
  name: string
  url: string
  defaultBranch: string
}

export function checkAuth(): void {
  try {
    execSync("gh auth status", { stdio: "pipe" })
  } catch {
    console.error("Error: gh CLI is not authenticated. Run `gh auth login` first.")
    process.exit(1)
  }
}

export function checkRepoRoot(): void {
  const cwd = process.cwd()
  if (!existsSync(join(cwd, "projects")) || !existsSync(join(cwd, "resources"))) {
    console.error(
      "Error: Not a valid workbench repo root (missing projects/ or resources/ directory)."
    )
    process.exit(1)
  }
}

export function getOrgs(): GhOrg[] {
  const userLogin = execSync("gh api /user --jq .login", { stdio: "pipe" })
    .toString()
    .trim()
  const orgsRaw = execSync("gh api /user/orgs", { stdio: "pipe" }).toString()
  const orgs: Array<{ login: string; description: string }> = JSON.parse(orgsRaw)
  return [
    { login: userLogin, description: "Personal account" },
    ...orgs.map((o) => ({ login: o.login, description: o.description ?? "" })),
  ]
}

export function getRepos(orgLogin: string): GhRepo[] {
  const raw = execSync(
    `gh repo list ${orgLogin} --json name,url,defaultBranchRef --limit 200`,
    { stdio: "pipe" }
  ).toString()
  const repos: Array<{ name: string; url: string; defaultBranchRef: { name: string } | null }> =
    JSON.parse(raw)
  return repos.map((r) => ({
    name: r.name,
    url: r.url,
    defaultBranch: r.defaultBranchRef?.name ?? "main",
  }))
}
