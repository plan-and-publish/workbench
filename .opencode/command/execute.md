---
description: Execute an implementation plan from a Linear issue. Provide a Linear issue ID as the argument. Best run in a new session.
---

# Implement Plan

You are tasked with implementing an approved technical plan from `thoughts/plans/`. These plans contain phases with specific changes and success criteria.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:
- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Track your progress and any deviations in the execution notes document

When things don't match the plan exactly, think about why and communicate clearly. The plan is your guide, but your judgment matters too.

If you encounter a mismatch:
- STOP and think deeply about why the plan can't be followed
- Present the issue clearly:
  ```
  Issue in Phase [N]:
  Expected: [what the plan says]
  Found: [actual situation]
  Why this matters: [explanation]

  How should I proceed?
  ```
- **Document deviations in the execution notes**: If proceeding with a change, record it in
  `thoughts/executions/{issue_id}_execution_notes.md`. Add or update a Deviations section:

  ```markdown
  ## Deviations

  ### Phase [N]: [Phase Name]
  - **Original Plan**: [what the plan specified]
  - **Actual Implementation**: [what was done]
  - **Reason**: [why the change was necessary]
  - **Impact**: [effects on other phases or success criteria]
  - **Date/Time**: [when the deviation was made]
  ```

## Verification Approach

After implementing a phase:
- Run the success criteria checks (usually `bun run check` covers everything)
- Fix any issues before proceeding
- Update your progress in the execution notes and your todos

Don't let verification interrupt your flow - batch it at natural stopping points.

## If You Get Stuck

When something isn't working as expected:
- First, make sure you've read and understood all the relevant code
- Consider if the codebase has evolved since the plan was written
- Present the mismatch clearly and ask for guidance

Use sub-tasks sparingly - mainly for targeted debugging or exploring unfamiliar territory.

## Resuming Work

If the plan has existing checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.

## Steps

1. **Check status-ticket label and fetch all context from Linear:**
   - Call `linear_get_issue` with the provided issue ID
   - Inspect the `labels[]` array. If the `status-ticket` group value is NOT `planned`, surface this to the user:
     > "The status-ticket label is currently `{value}`, not `planned`. Execution is intended to run after planning. Do you want to proceed anyway?"
   - Wait for explicit confirmation before continuing if the label is not `planned`
   - Read the issue `description` field — this is the ticket content
   - Fetch all attachments:
     - For each entry in `attachments[]`, call `linear_get_attachment` with the attachment `id`
     - Decode each base64 result: `echo "$base64_content" | base64 --decode`
   - **Identify the plan attachment** by finding the attachment whose `title` starts with `"Plan:"`.
     - If NO such attachment exists, **stop immediately** and inform the user:
       > "No plan attachment was found on issue {issue_id}. Cannot proceed with execution. Please run /plan first."
     - Do not proceed until a plan attachment is confirmed present.
   - Treat all other attachments (research, prior artefacts) as additional context.
   - **IMPORTANT**: Do not read any local `thoughts/` files as inputs.

2. **Read the plan completely** from the decoded plan attachment content. Check for any execution notes attachment from a prior partial run (title starts with `"Execution Notes:"`). If one exists, read it to understand what was already completed — trust completed phases and pick up from the first incomplete item.

3. **Consider the steps involved in the plan.** Think deeply about how the pieces fit together and derive a detailed todo list from the plan's phases and requirements.

4. **Implement each phase sequentially**, adapting to what you find while following the plan's intent.

5. **Verify each phase** using the success criteria checks (usually `bun run check` covers everything). Fix any issues before proceeding.

6. **Maintain execution notes throughout the run.**
   Write or update `thoughts/executions/{issue_id}_execution_notes.md` to record:
   - Phases completed and any deviations encountered
   - Discoveries made during implementation
   - Decisions taken that differ from the plan

   At the end of execution, attach the execution notes to the Linear issue:
   1. Encode: `base64 < thoughts/executions/{issue_id}_execution_notes.md` via Bash tool
   2. Call `linear_create_attachment` with:
      - `issue`: the Linear issue ID
      - `base64Content`: the encoded string
      - `filename`: `{issue_id}_execution_notes.md`
      - `contentType`: `"text/markdown"`
      - `title`: `"Execution Notes: {issue_id}"`

7. **Handle any mismatches or issues** by presenting them clearly and asking for guidance if needed.

8. **Set status-ticket label to 'implemented':**
   Using the label preservation protocol:
   1. Call `linear_get_issue` to get the current `labels[]` array
   2. Remove any existing `status-ticket` group value
   3. Append `"implemented"` to the array
   4. Call `linear_save_issue` with the full updated labels array

Use the todowrite tool to create a structured task list for the 8 steps above, marking each as pending initially. Note that Step 3 may expand into multiple implementation subtasks derived from the plan.

**issue_id**

$ARGUMENTS
