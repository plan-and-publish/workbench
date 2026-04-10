import { execSync, execFile } from "child_process"
import { promisify } from "util"
import { existsSync } from "fs"
import { join } from "path"

const execFileAsync = promisify(execFile)

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

export async function getOrgs(): Promise<GhOrg[]> {
  // Run both gh calls concurrently — cuts latency roughly in half
  const [userResult, orgsResult] = await Promise.all([
    execFileAsync("gh", ["api", "/user", "--jq", ".login"], { encoding: "utf8" }),
    execFileAsync("gh", ["api", "/user/orgs"], { encoding: "utf8" }),
  ])
  const userLogin = userResult.stdout.trim()
  const orgs: Array<{ login: string; description: string }> = JSON.parse(orgsResult.stdout)
  return [
    { login: userLogin, description: "Personal account" },
    ...orgs.map((o) => ({ login: o.login, description: o.description ?? "" })),
  ]
}

export async function getRepos(orgLogin: string): Promise<GhRepo[]> {
  const { stdout } = await execFileAsync(
    "gh",
    ["repo", "list", orgLogin, "--json", "name,url,defaultBranchRef", "--limit", "200"],
    { encoding: "utf8" }
  )
  const repos: Array<{ name: string; url: string; defaultBranchRef: { name: string } | null }> =
    JSON.parse(stdout)
  return repos.map((r) => ({
    name: r.name,
    url: r.url,
    defaultBranch: r.defaultBranchRef?.name ?? "main",
  }))
}

export function validateRepoName(name: string): boolean {
  return name.length > 0 && name.length <= 100 && /^[a-zA-Z0-9._-]+$/.test(name)
}

export async function repoExists(owner: string, repo: string): Promise<boolean> {
  try {
    await execFileAsync("gh", ["api", `/repos/${owner}/${repo}`], { encoding: "utf8" })
    return true
  } catch {
    return false
  }
}

export async function createRepo(
  org: string,
  name: string
): Promise<string> {
  const { stdout } = await execFileAsync(
    "gh",
    ["repo", "create", `${org}/${name}`, "--private"],
    { encoding: "utf8" }
  )
  return stdout.trim()
}

export async function getCurrentUserLogin(): Promise<string> {
  const { stdout } = await execFileAsync("gh", ["api", "/user", "--jq", ".login"], { encoding: "utf8" })
  return stdout.trim()
}
