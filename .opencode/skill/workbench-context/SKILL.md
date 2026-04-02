---
name: workbench-context
description: Provides pathway detection and ck availability instructions for workbench commands. Load this skill to determine whether the workbench is in development mode (Pathway 1) or configured project mode (Pathway 2), and whether ck semantic search tools are available.
---

# Workbench Context Skill

This skill provides instructions for detecting the workbench's operational mode and checking ck semantic search availability. Load this skill at the start of every command to determine pathway context.

## Pathway Detection

Check for `.workbench/config.yaml` in the repository root using Bash:

```
test -f .workbench/config.yaml
```

- **Present** (exit code 0): Pathway 2 (configured project mode)
- **Absent** (exit code 1): Pathway 1 (workbench development mode)

This is a presence-only check. Do not parse or read `config.yaml`.

## ck Availability Check

1. Run `which ck` via Bash to check if the ck CLI is installed
2. If found, run `ck --status` to verify index readiness
3. On any failure: warn the user and continue with grep/glob only (graceful degradation — never block execution)

## Context Passing Format

After detecting pathway and checking ck availability, include the appropriate context block in every spawned agent's prompt.

### Pathway 2 (configured project mode)

```
Pathway context: The workbench is in configured project mode (Pathway 2).
- Primary code scope: projects/ (target project source code)
- Documentation scope: resources/ (supporting docs and metadata)
- Workbench source: packages/ (the workbench CLI itself — search only if the task relates to workbench internals)
- ck semantic search: [available | unavailable — use grep/glob only]
- When ck is available, prefer ck_semantic_search and ck_hybrid_search as complements to grep/glob for discovering relevant files
```

### Pathway 1 (workbench development mode)

```
Pathway context: The workbench is in development mode (Pathway 1).
- Primary code scope: packages/ (workbench source code)
- Documentation scope: thoughts/ (research, plans, architecture docs)
- ck semantic search: not applicable in development mode
```
