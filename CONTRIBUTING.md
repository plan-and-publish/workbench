# Contributing to workbench

Thank you for your interest in contributing! This document covers how to get set up, the project structure, and how to submit changes.

## Who uses this

workbench is built and used by the [PAP](https://pap.dev) team internally and is open for community contributions.

## Project structure

```
workbench/
├── packages/
│   └── workbench-cli/   # The `workbench` CLI tool (TypeScript, Bun)
├── projects/            # Git submodules for code repos
├── resources/           # Git submodules for documentation repos
├── scripts/             # Helper scripts
└── thoughts/            # Planning notes and research docs
```

## Setting up locally

**Prerequisites:**
- [Bun](https://bun.sh) installed
- [gh CLI](https://cli.github.com) installed and authenticated

```bash
git clone https://github.com/plan-and-publish/workbench.git
cd workbench/packages/workbench-cli
bun install
```

## Development workflow

All CLI source lives in `packages/workbench-cli/src/`.

```bash
# Type-check
bun tsc --noEmit

# Build
bun run build

# Run directly without building
bun run src/index.ts --help

# Smoke test the built output
./dist/index.js --help
```

## Submitting a pull request

1. Fork the repo and create a branch from `main`.
2. Make your changes in `packages/workbench-cli/src/`.
3. Run type-check and build to make sure nothing is broken.
4. Open a PR against `main` — the CI workflow will run automatically.
5. Describe what you changed and why in the PR description.

## Releases

Releases are tag-driven. Maintainers run one of:

```bash
npm run release:patch   # 0.1.x
npm run release:minor   # 0.x.0
npm run release:major   # x.0.0
```

This bumps the version, commits, and tags. Pushing the tag triggers the publish workflow, which publishes to both [npm](https://www.npmjs.com/package/@pap.dev/workbench) and [JSR](https://jsr.io/@pap/workbench).

## Reporting bugs

Open an issue using the [bug report template](https://github.com/plan-and-publish/workbench/issues/new?template=bug_report.md).

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).
