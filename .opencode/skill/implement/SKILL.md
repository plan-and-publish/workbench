# Skill: implement

# Implement Workflow Skill

This skill defines the workflow sequence and resume rules for the `/implement` orchestrator command.
Treat this file as the single source of truth for step ordering, status dispatch, and stop conditions.

Invocation contract:

`/implement <issue-id> [ticket|research|plan|execute|review|commit]`

The optional stop-step input is case-insensitive at input, normalized to lowercase, then validated against the exact allowed set.

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
2. Run the command in a brand new session using JSON output (`opencode run --format json --command <step> <issue_id>`).
3. Extract and record `session_id` from valid JSON output.
4. Continue interactive follow-ups only with `--session <session_id>` and JSON mode (`opencode run --format json --session <session_id> <response>`); never use `--continue`.
5. Treat valid JSON missing required `session_id` as a protocol error, classify as `failed`, and stop immediately.
6. Treat unclear prompt extraction from JSON as a parser error, classify as `failed`, and stop immediately (no retry).
7. Never expose raw JSON event streams to users.
8. Capture the outcome as one of:
   - `success` - command completed without unresolved blockers
   - `blocked` - command asked a blocking/critical question that needs escalation
   - `failed` - command errored or could not complete
9. Treat each `opencode run` invocation as one attempt for the step; attempt index starts at `1` and increments for each invocation, including `--session` continuations.
10. Measure active runtime per attempt from immediately before invocation to command return; do not include human wait time.
11. Extract `cost` from JSON output when present; if missing, record `N/A` and never coerce to `0`.
12. Include all attempts in per-step and workflow aggregates, including failed and retried attempts.
13. Preserve raw numeric precision for cost values when available.
14. Apply strict missing-cost aggregation:

```text
if any attempt cost is missing:
  Total Cost = N/A
  Known Cost Subtotal = sum(numeric attempt costs)
else:
  Total Cost = sum(all attempt costs)
```

15. Announce step completion state.

## Question Handling Policy

When a sub-command asks a question:

- First apply orchestrator strategy from `.workbench/settings.yml`.
- Auto-answer only when confidence is high and the question is non-critical.
- Escalate to the user when the question is blocking, critical, or high-impact.
- Ask one targeted escalation question at a time.
- Provide concise options with each escalation.
- Include an explicit `Recommended default:` label with every escalation.
- Accept freeform overrides only when unambiguous and safe.
- If freeform is ambiguous or unsafe, re-prompt with one targeted question plus concise options and recommended default.
- Freeform overrides must never change workflow order or status-transition semantics.

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
- Stop-step validation fails because requested step is earlier than current progression
- A parser error or protocol error occurs

Do not continue to subsequent steps after a stop condition.

## Completion Contract

A successful orchestrator run includes:

- All required remaining commands ran in order from computed start point
- Per-step status updates were shown
- Final summary includes `Report Version: v1`
- Final summary includes `Report Status: Complete|Partial`
- Partial runs include `Final Stop Reason: <reason>`
- Final summary includes per-attempt rows (step, attempt index, outcome, active runtime, cost, reason, session metadata)
- Final summary includes per-step aggregates (active runtime, strict cost totals, outcome counts)
- Final summary includes workflow totals (total active runtime and strict total cost fields)
- A new Linear document is created on every run with title `Implementation Report: <ISSUE_ID> - YYYY-MM-DDTHH-MM-SSZ`
- Document content is the full human-readable markdown implementation report

## Maintenance Guidance

To change workflow behavior:

1. Update the canonical flow and status mapping in this file.
2. Keep mapping values aligned with the PM status lifecycle.
3. Keep `/implement` command logic generic; do not hard-code sequence outside this skill.
