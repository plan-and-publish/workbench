# workbench

- This repository will be used as a generic workbench for development and maintaining of different projects code and documentation.

## Folder Structure

- 'resources' folder contains mostly documentation and information.
- 'projects' folder continas source codes that an engineer will pull to work on
- 'scrips' contains helper codes that facilitate certain activities to give easier access to manage the codebase

## MCP

### Linear Authentication

Linear is a project management tool that is used to track the progress of projects. It is used to manage the tasks, issues, and other information related to the projects.

To authenticate the Linear MCP (defined in [.opencode/opencode.json](.opencode/opencode.json)), run the following command for interactive authentication:

```bash
opencode mcp auth linear
```

## workbench CLI

The `workbench` CLI provides a terminal UI for initialising the workbench repository.

### Prerequisites

- [Bun](https://bun.sh) installed
- [gh CLI](https://cli.github.com) installed and authenticated (`gh auth login`)

### Install

```bash
cd packages/workbench-cli
bun install
bun link
```

### Run (without installing)

```bash
bun run packages/workbench-cli/src/index.ts
```

### Quick Start

**Interactive init** — fork, clone, and set up in one flow:

```bash
workbench --init
```

**Non-interactive init** — create with defaults:

```bash
workbench --init --no-tui --name my-project
```

**Init + setup combined:**

```bash
workbench --init --no-tui --name my-project --org myorg --code-repository https://github.com/myorg/api
```

**Manual alternative** — fork/clone the repo yourself, then:

```bash
workbench --tui
```

### Usage

Run `workbench` from the workbench repository root. Select `init` to walk through:

1. Select GitHub org or personal account
2. Select code repositories (submodules under `projects/`)
3. Select resource repositories (submodules under `resources/`)
4. Configure branch per repository
5. Optionally index with `ck`

After init, `.workbench/config.yaml` is written with the selected configuration.

See [packages/workbench-cli/README.md](packages/workbench-cli/README.md) for full documentation.
