# workbench

[![CI](https://github.com/plan-and-publish/workbench/actions/workflows/ci-workbench-cli.yml/badge.svg)](https://github.com/plan-and-publish/workbench/actions/workflows/ci-workbench-cli.yml)
[![npm](https://img.shields.io/npm/v/@pap.dev/workbench)](https://www.npmjs.com/package/@pap.dev/workbench)
[![JSR](https://jsr.io/badges/@pap/workbench)](https://jsr.io/@pap/workbench)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A generic development workbench for setting up and maintaining multiple projects from a single repository. Built and used internally by [PAP](https://pap.dev) — a no-code mobile building platform — and open for community use.

The repository acts as a hub: engineers fork it, configure their code and resource repositories as submodules, and get a consistent environment across the team.

## Folder structure

| Folder | Purpose |
|--------|---------|
| `packages/workbench-cli/` | The `workbench` CLI tool (TypeScript, Bun) |
| `projects/` | Git submodules for code repositories |
| `resources/` | Git submodules for documentation/resource repositories |
| `scripts/` | Helper scripts for managing the codebase |
| `thoughts/` | Planning notes, research, and ticket documentation (Not checked in) |

## MCP — Linear

[Linear](https://linear.app) is used for project management. To authenticate the Linear MCP (defined in [.opencode/opencode.json](.opencode/opencode.json)), run:

```bash
opencode mcp auth linear
```

## workbench CLI

The `workbench` CLI provides a terminal UI for initializing a workbench repository — forking, cloning, and wiring up submodules interactively or non-interactively.

### Prerequisites

- [Bun](https://bun.sh) installed
- [gh CLI](https://cli.github.com) installed and authenticated (`gh auth login`)

### Install

```bash
cd packages/workbench-cli
bun install
bun link
```

### Quick start

**Interactive init** — fork, clone, and set up in one flow:

```bash
workbench --init
```

**Non-interactive init:**

```bash
workbench --init --no-tui --name my-project
```

**Init + setup combined:**

```bash
workbench --init --no-tui --name my-project --org myorg --code-repository https://github.com/myorg/api
```

**Already have a workbench repo cloned?**

```bash
workbench --tui
```

See [packages/workbench-cli/README.md](packages/workbench-cli/README.md) for the full flag reference and examples.

## Working on issues with OpenCode

Once your workbench is set up, the primary way to work on issues is through [OpenCode](https://opencode.ai/) using the built-in slash commands. These commands implement a structured flow from issue analysis through to review.

### Prerequisites

- [OpenCode](https://opencode.ai/) installed
- Linear MCP authenticated (see [MCP — Linear](#mcp--linear) above)

### The development flow

```
/implement
```

`/implement` is the end-to-end orchestrator. It resumes from the issue's
current `status-ticket` label and runs the remaining commands automatically.

Manual flow remains available:

```
/ticket → /research → /plan → /execute → /review → /commit
```

Each command takes a Linear issue ID as its argument and is best run in a fresh OpenCode session:

| Command | What it does |
|---------|-------------|
| `/ticket {issue-id}` | Analyses the Linear issue and structures it for development |
| `/research {issue-id}` | Researches the codebase in context of the issue |
| `/plan {issue-id}` | Creates a detailed implementation plan |
| `/execute {issue-id}` | Implements the plan |
| `/implement {issue-id}` | Orchestrates all remaining workflow steps |
| `/commit` | Commits the changes in atomic commits, ready for review |
| `/review {issue-id}` | Reviews the execution against the plan |

### Example

```bash
# Manual flow
/ticket PAP-1234
/research PAP-1234
/plan PAP-1234
/execute PAP-1234
/review PAP-1234
/commit

# Orchestrated flow
/implement PAP-1234
```

The commands are defined in [`.opencode/command/`](.opencode/command/) and can be customised for your own workflow.

## Code indexing with ck

The setup wizard optionally indexes your repositories with [ck](https://beaconbay.github.io/ck/) — a hybrid code search tool by [BeaconBay](https://github.com/beaconbay) that fuses lexical (BM25/grep) precision with embedding-based recall, so you can find the right code even when the exact keywords aren't there.

## Acknowledgements

workbench is inspired by [Cluster444/agentic](https://github.com/Cluster444/agentic), which pioneered the idea of a structured agentic development workflow using slash commands.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, the development workflow, and how to submit a PR.

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## License

MIT — see [LICENSE](LICENSE).
