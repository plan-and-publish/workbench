---
name: linear
description: Linear project management integration. Provides tool mappings, status protocols, document operations, and workflow patterns for Linear. Load this skill when the configured project management tool is 'linear'.
---

# Linear Project Management Skill

All project management operations use Linear MCP tools. This skill maps generic operations to Linear-specific tool calls and defines protocol patterns for common workflows.

## Critical Rules

1. **The issue description on Linear is the sole source of truth.** Do not read local `thoughts/` files as inputs — they are convenience copies only.
2. **Never update existing documents.** Always create new ones for follow-ups.
3. **Preserve non-status labels** when updating issue status. Never remove labels that are not part of the status-ticket group.
4. **Content is literal Markdown.** When creating documents or updating descriptions, use literal newlines and special characters — do not escape them.

## Tool Mapping

| Generic Operation | Linear Tool Call |
|---|---|
| Retrieve an issue | `linear_get_issue({ id: "{issue_id}" })` |
| Retrieve an issue with relations | `linear_get_issue({ id: "{issue_id}", includeRelations: true })` |
| Update an issue | `linear_save_issue({ id: "{issue_id}", ...fields })` |
| Overwrite issue description | `linear_save_issue({ id: "{issue_id}", description: "{content}" })` |
| Update issue labels | `linear_save_issue({ id: "{issue_id}", labels: ["{label1}", "{label2}"] })` |
| List documents for an issue | Retrieve the issue — the response includes an associated `documents` array with `id` and `title` for each |
| Retrieve a document | `linear_get_document({ id: "{document_id}" })` |
| Create a document | `linear_create_document({ issue: "{issue_id}", title: "{title}", content: "{content}" })` |

## Status Management

### Status Values

The status lifecycle follows this order:

`open → researched → planned → implemented → reviewed`

These values correspond to the `status-ticket` label group in Linear.

### Status Guard

Before performing a workflow operation, verify the issue has the expected status:

1. Retrieve the issue using the issue ID
2. Inspect the `labels[]` array for the `status-ticket` group value
3. If the status does not match the expected value, surface a warning:
   > "The issue status is currently `{status}`, not `{expected}`. {Operation} is intended to run after {previous step}. Do you want to proceed anyway?"
4. Wait for explicit confirmation before continuing if the status is not as expected

### Label Preservation Protocol

When updating the issue status:

1. Retrieve the issue to get the current `labels[]` array
2. Remove any existing `status-ticket` group value (`open`, `researched`, `planned`, `implemented`, `reviewed`)
3. Append the new status value to the labels array
4. Update the issue: `linear_save_issue({ id: "{issue_id}", labels: ["{preserved_label_1}", "{preserved_label_2}", "{new_status}"] })`

**Example**: Issue has labels `["researched", "Improvement"]`. Setting status to `"planned"`:
- Remove `"researched"` (current status)
- Keep `"Improvement"` (non-status label)
- Append `"planned"`
- Result: `linear_save_issue({ id: "PAP-7018", labels: ["Improvement", "planned"] })`

## Document Operations

### Creating Documents

Use `linear_create_document` with:
- `issue`: the issue ID (e.g., `"PAP-7018"`)
- `title`: the document title (e.g., `"Research: PAP-7018 - Topic Name"`)
- `content`: the full Markdown content — use literal newlines and special characters, not escape sequences

Rules:
- Never update existing documents — always create new ones
- Follow-up documents use titles like `"Research: {issue_id} - {topic} (part N)"`

### Fetching Documents

1. Retrieve the issue to get the list of associated documents (the response includes a `documents` array with `id` and `title` for each)
2. For each document, call `linear_get_document` with the document `id` to retrieve full content

Document identification by title prefix:
- `"Research:"` — research documents
- `"Plan:"` — implementation plans
- `"Execution Notes:"` — execution notes
- `"Review:"` — review documents

## Issue References

### Issue URL

Format: `https://linear.app/plan-and-publish/issue/{issue_id}/{slug}`

Use this format when referencing issues in documents or plans.

### Commit Trailer

Format: `Delivers {issue_id}`

Example:
```

Delivers PAP-7018

```

This creates bidirectional links in the Linear UI between the commit and the issue. Include this trailer on the first commit only when an issue ID is associated with the changes.

### Issue ID in Branch Names

Extract the issue ID from the branch name by matching the `{PREFIX}-{NUMBER}` segment.
Example: `feature/pap-7024-desc` → `PAP-7024` (normalised to uppercase).
