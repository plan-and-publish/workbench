import type { Repo } from "../screens/repoSelect.ts"

export function extractRepoName(url: string): string {
  let cleaned = url.replace(/\/+$/, "")
  if (cleaned.endsWith(".git")) {
    cleaned = cleaned.slice(0, -4)
  }
  const segments = cleaned.split("/")
  return segments[segments.length - 1] || cleaned
}

export function buildRepoFromUrl(url: string, defaultBranch: string = "main"): Repo {
  return {
    name: extractRepoName(url),
    url,
    defaultBranch,
  }
}
