---
description: Orchestrate the full workflow for an issue. Usage: /implement <issue-id> [ticket|research|plan|execute|review|commit].
---

# Implement Workflow

You are an orchestration agent for the end-to-end issue workflow.
You run the next required command based on issue status, resume from partial progress, and stop safely on failures.

## Core Principles

- Load the `implement` skill as the single source of truth for sequence and status-to-command mapping.
- Run every sub-command in a fresh OpenCode session.
- Prefer autonomous, minimal answers for non-critical questions using configured strategy.
- Escalate blocking or critical decisions to the user.
- Fail fast: never continue after a failed or unresolved blocking step.
- Use `opencode --format json` for every sub-command call in this orchestrator.
- Continue sessions with `--session <session_id>` only; never use `--continue`.
- Never show raw JSON event streams to users; summarize outcomes and relay only extracted prompt text.

## Steps

1. **Parse arguments and validate stop-step input**
   - Accept invocation format: `/implement <issue-id> [ticket|research|plan|execute|review|commit]`.
   - Treat the first argument as `issue_id`.
   - Treat the second argument as optional `stop_step`.
   - If `stop_step` is provided, normalize case-insensitively to canonical lowercase.
   - Validate `stop_step` against the exact allowed set before any sub-command execution attempt.
   - If invalid, fail immediately as a validation error and stop.

2. **Load context and guards**
   - Retrieve the issue by the provided issue ID.
   - Read the issue description and labels.
   - Load `workbench-context` skill and resolve pathway and ck availability.
   - Resolve configured PM tool from `.workbench/settings.yml` and use the corresponding PM skill.
   - Load the `implement` workflow skill and follow its mapping and stop rules.

3. **Resolve strategy settings**
   - Read `.workbench/settings.yml`.
   - Use `orchestrator.strategy` and `orchestrator.escalation` values.
   - If `orchestrator` is absent, use schema defaults as behavioral defaults.
   - Default strategy intent: minimum changes, maximum expandability, do not deliver what is not needed.

4. **Compute start point from current status and apply stop-step boundary checks**
   - Determine the current `status-ticket` label value.
   - Use the implement skill mapping to determine the next command.
   - If status is unknown, present the mismatch and ask the user how to proceed.
   - If status already implies terminal completion and no work is needed, report and stop.
   - If `stop_step` is provided, compare it to current progression before running any sub-command.
   - If requested `stop_step` is earlier than current progression, fail fast with:

```text
Stop-step validation failed
- Current status: <status-ticket>
- Requested step: <normalized_stop_step>
- Reason: requested step is earlier than current progression
- Next valid step: <computed_next_step>
```

   - If `stop_step` is valid and not earlier than current progression, execute only through that step.

5. **Execute remaining workflow sequentially**
   - For each remaining command from the computed start point (bounded by optional `stop_step`):
     - Announce: command name, position in workflow, and current issue status.
     - Run in a fresh session via Bash with JSON output:
       - `opencode run --format json --command "<command>" "<issue_id>"`
     - Capture machine-readable JSON events and exit status.
     - Extract `session_id` from valid JSON output for traceability and continuation.
     - If JSON is valid but required `session_id` is missing, classify as protocol error, mark step `failed`, and stop immediately.
     - Classify result as `success`, `blocked`, or `failed` using the workflow skill run contract.

6. **Handle sub-command questions**
   - If JSON output contains a question prompt:
     - Extract and normalize question text from JSON; never print raw JSON.
     - If non-critical and confidence is high, answer using strategy principles.
     - Keep answers minimal, scoped, and extensible.
     - If blocking/critical or low confidence, escalate to the user with exactly one targeted question.
     - Every escalation must include concise options and an explicit `Recommended default:` label.
     - Accept freeform user overrides only when unambiguous and safe.
     - If freeform is ambiguous or unsafe, ask one targeted re-prompt with concise options and a recommended default.
     - Freeform overrides must never alter workflow order or status-transition semantics.
   - If a session must continue after an answer, continue the same session with:
     - `opencode run --format json --session "<session_id>" "<response>"`
   - If prompt extraction is unclear or cannot be trusted, classify as parser error, mark step `failed`, and stop immediately (no retry).
   - Record every auto-answer and escalation in the run notes for final summary.

7. **Enforce graceful failure**
   - On `failed` result: stop immediately, show the failing command, concise reason, and safe diagnostic summary.
   - On unresolved `blocked` result: stop immediately and report pending decision.
   - Map parser errors and protocol errors to `failed` with explicit reason labels.
   - On protocol errors, stop immediately even if partial step progress occurred.
   - Never run subsequent commands after stop conditions.

8. **Provide continuous status updates**
   - Before each command: what is about to run and why.
   - After each command: outcome and next action.
   - Keep updates concise and actionable.

9. **Emit final summary**
   - At run end (success or failure), provide a structured summary including:
      - Issue ID
      - Start status and computed entry command
      - Commands attempted in order
      - Outcome per command (`success`/`blocked`/`failed`)
      - Session ID per attempted command when available (including failed attempts)
      - Escalations asked to the user and their resolutions
      - Notable artifacts created (documents/commits) reported by sub-commands
      - Final stop reason (completed or first failure/blocker)

## Important Notes

- Do not duplicate or overwrite existing PM documents; rely on each sub-command's own document rules.
- Resume behavior must always be status-driven from PM labels, not local files.
- Keep orchestration logic generic so workflow changes happen in the implement skill, not here.
- Parser/protocol issues are fail-fast and must not trigger automatic retry in this amendment.

**issue_id [stop_step]**

$ARGUMENTS
