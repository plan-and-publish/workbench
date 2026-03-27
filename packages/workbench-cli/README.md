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

## Usage

Run the `workbench` command from the workbench repository root. Select `init` to walk through the interactive setup:

1. Select a GitHub organization or personal account.
2. Select code repositories (added as submodules under the `projects/` directory).
3. Select resource repositories (added as submodules under the `resources/` directory).
4. Configure the target branch per repository.
5. Optionally index with `ck`.

After initialization, the selected configuration is written to `.workbench/config.yaml`.
