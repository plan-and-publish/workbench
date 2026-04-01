# Workbench

The `workbench` CLI provides a terminal UI for initializing the workbench repository.

## Prerequisites

- [Bun](https://bun.sh) installed
- [gh CLI](https://cli.github.com) installed and authenticated (`gh auth login`)

## Installation

To install dependencies and link the CLI locally:

```bash
bun install
bun link
```

After linking, the `workbench` command will be available globally on your system.

## Run (without installing)

You can run the CLI directly from the source without linking:

```bash
bun run src/index.ts
```

## Quick Start

### Interactive (TUI)

Create a new workbench from scratch:

```bash
workbench --init
```

This launches an interactive flow: select a fork target (org or personal account), name your workbench, fork and clone the template repo, then optionally run the setup wizard.

### Non-interactive

Create a workbench without prompts:

```bash
workbench --init --no-tui --name my-project
```

### Combined (init + setup in one command)

```bash
workbench --init --no-tui --name my-project --org myorg --code-repository https://github.com/myorg/api
```

### Manual Setup

If you already have a workbench repo cloned:

```bash
workbench --tui
```

## Init Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--init` | Initialize a new workbench (fork & clone) | `false` |
| `--name <name>` | Name for the fork and local folder | `workbench` |
| `--no-fork` | Clone without forking (read-only) | `false` |
| `--no-tui` | Skip TUI, use defaults or provided values | `false` |

## Setup Flags

These flags work with both `--init` and standalone usage:

| Flag | Description | Default |
|------|-------------|---------|
| `--org <name>` | GitHub organization name | personal account |
| `--code-repository <url>` | Code repository URL (can be repeated) | - |
| `--resource-repository <url>` | Resource repository URL (can be repeated) | - |
| `--code-branch <name>` | Branch for all code repositories | `main` |
| `--resource-branch <name>` | Branch for all resource repositories | `main` |
| `--index <on\|off>` | Run indexing after init | `on` |
| `--tui` | Launch interactive TUI mode | `false` |

## Examples

```bash
# Interactive init
workbench --init

# Non-interactive init with custom name
workbench --init --no-tui --name my-project

# Clone without forking (read-only)
workbench --init --no-tui --no-fork --name explore-wb

# Init + setup in one command
workbench --init --no-tui --name my-project --org myorg --code-repository https://github.com/myorg/api

# Standalone setup (existing repo)
workbench --org myorg --code-repository https://github.com/myorg/backend

# Interactive setup (existing repo)
workbench --tui
```

## Error Scenarios

| Error | Cause | Resolution |
|-------|-------|------------|
| `A repository named "X" already exists under Y` | Fork name conflict | Choose a different `--name` |
| `A folder named "X" already exists in the current directory` | Local folder conflict | Remove or rename the folder, or choose a different name |
| `gh CLI is not authenticated` | `gh auth` not set up | Run `gh auth login` |
| `Invalid name "X"` | Bad characters in name | Use only alphanumeric, `-`, `.`, `_` |

## Usage (Existing Repo)

Run the `workbench` command from the workbench repository root. Select `init` to walk through the interactive setup:

1. Select a GitHub organization or personal account.
2. Select code repositories (added as submodules under the `projects/` directory).
3. Select resource repositories (added as submodules under the `resources/` directory).
4. Configure the target branch per repository.
5. Optionally index with `ck`.

After initialization, the selected configuration is written to `.workbench/config.yaml`.
