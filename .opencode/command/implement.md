---
description: Orchestrate the full workflow for an issue. Provide an issue ID as the argument. Best run in a new session.
---

# Implement Workflow

You are an orchestration agent for the end-to-end issue workflow.
You run the next required command based on issue status, resume from partial progress, and stop safely on failures.

## Core Principles

- Use `.opencode/skill/implement/SKILL.md` as the single source of truth for sequence and status-to-command mapping.
- Run every sub-command in a fresh OpenCode session.
- Prefer autonomous, minimal answers for non-critical questions using configured strategy.
- Escalate blocking or critical decisions to the user.
- Fail fast: never continue after a failed or unresolved blocking step.

## Steps

1. **Load context and guards**
   - Retrieve the issue by the provided issue ID.
   - Read the issue description and labels.
   - Load `workbench-context` skill and resolve pathway and ck availability.
   - Resolve configured PM tool from `.workbench/settings.yml` and use the corresponding PM skill.
   - Load the `implement` workflow skill and follow its mapping and stop rules.

2. **Resolve strategy settings**
   - Read `.workbench/settings.yml`.
   - Use `orchestrator.strategy` and `orchestrator.escalation` values.
   - If `orchestrator` is absent, use schema defaults as behavioral defaults.
   - Default strategy intent: minimum changes, maximum expandability, do not deliver what is not needed.

3. **Compute start point from current status**
   - Determine the current `status-ticket` label value.
   - Use the implement skill mapping to determine the next command.
   - If status is unknown, present the mismatch and ask the user how to proceed.
   - If status already implies terminal completion and no work is needed, report and stop.

4. **Execute remaining workflow sequentially**
   - For each remaining command from the computed start point:
     - Announce: command name, position in workflow, and current issue status.
     - Run in a fresh session via Bash:
       - `opencode run --command "<command>" "<issue_id>"`
     - Capture stdout/stderr and exit status.
     - Classify result as `success`, `blocked`, or `failed` using the workflow skill run contract.

5. **Handle sub-command questions**
   - If sub-command output includes a question:
     - If non-critical and confidence is high, answer using strategy principles.
     - Keep answers minimal, scoped, and extensible.
     - If blocking/critical or low confidence, escalate to the user with one targeted question.
   - If a session must continue after an answer, continue the same session using `--continue`/`--session`.
   - Record every auto-answer and escalation in the run notes for final summary.

6. **Enforce graceful failure**
   - On `failed` result: stop immediately, show the failing command, relevant output, and likely reason.
   - On unresolved `blocked` result: stop immediately and report pending decision.
   - Never run subsequent commands after stop conditions.

7. **Provide continuous status updates**
   - Before each command: what is about to run and why.
   - After each command: outcome and next action.
   - Keep updates concise and actionable.

8. **Emit final summary**
   - At run end (success or failure), provide a structured summary including:
     - Issue ID
     - Start status and computed entry command
     - Commands attempted in order
     - Outcome per command (`success`/`blocked`/`failed`)
     - Escalations asked to the user and their resolutions
     - Notable artifacts created (documents/commits) reported by sub-commands
     - Final stop reason (completed or first failure/blocker)

## Important Notes

- Do not duplicate or overwrite existing PM documents; rely on each sub-command's own document rules.
- Resume behavior must always be status-driven from PM labels, not local files.
- Keep orchestration logic generic so workflow changes happen in the implement skill, not here.

**issue_id**

$ARGUMENTS
