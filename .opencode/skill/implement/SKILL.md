# Skill: implement

# Implement Workflow Skill

This skill defines the workflow sequence and resume rules for the `/implement` orchestrator command.
Treat this file as the single source of truth for step ordering, status dispatch, and stop conditions.

## Canonical Workflow

The orchestrated flow is:

`ticket -> research -> plan -> execute -> review -> commit`

Each command runs in a fresh OpenCode session.

## Status-Driven Dispatch

Use the issue's `status-ticket` label to decide where to start.

| Current status-ticket value | Next command to run |
|---|---|
| none (no status label) | `ticket` |
| `open` | `research` |
| `researched` | `plan` |
| `planned` | `execute` |
| `implemented` | `review` |
| `reviewed` | `commit` |

### Notes

- `commit` is terminal for this orchestrator flow.
- Unknown status values must stop execution and require user input.
- Non-status labels must always be preserved by sub-commands that update status.

## Run Contract Per Step

For each step, the orchestrator must:

1. Announce step start to the user.
2. Run the command in a brand new session (`opencode run --command <step> <issue_id>`).
3. Capture the outcome as one of:
   - `success` - command completed without unresolved blockers
   - `blocked` - command asked a blocking/critical question that needs escalation
   - `failed` - command errored or could not complete
4. Announce step completion state.

## Question Handling Policy

When a sub-command asks a question:

- First apply orchestrator strategy from `.workbench/settings.yml`.
- Auto-answer only when confidence is high and the question is non-critical.
- Escalate to the user when the question is blocking, critical, or high-impact.

Critical/high-impact examples:

- Scope expansion beyond ticket boundaries
- Security, privacy, billing, or data migration decisions
- Destructive or irreversible operations
- Conflicting requirements with no safe default

## Stop Conditions

Stop immediately when any of the following occurs:

- A sub-command returns `failed`
- A blocking question is escalated and cannot be resolved
- The status label is unknown and the user does not provide direction

Do not continue to subsequent steps after a stop condition.

## Completion Contract

A successful orchestrator run includes:

- All required remaining commands ran in order from computed start point
- Per-step status updates were shown
- Final summary includes attempted steps, outcomes, escalations, and notable artifacts

## Maintenance Guidance

To change workflow behavior:

1. Update the canonical flow and status mapping in this file.
2. Keep mapping values aligned with the PM status lifecycle.
3. Keep `/implement` command logic generic; do not hard-code sequence outside this skill.
