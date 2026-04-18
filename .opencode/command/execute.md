---
description: Execute an implementation plan from an issue. Provide an issue ID as the argument. Best run in a new session.
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
- When spawning sub-tasks, include pathway context in agent prompts using the format from the workbench-context skill

## Resuming Work

If the plan has existing checkmarks:
- Trust that completed work is done
- Pick up from the first unchecked item
- Verify previous work only if something seems off

Remember: You're implementing a solution, not just checking boxes. Keep the end goal in mind and maintain forward momentum.

## Steps

1. **Check status and fetch all context:**
   - Retrieve the issue using the provided issue ID
   - If the `status-ticket` label is not 'planned', surface this to the user:
     > "The `status-ticket` label is currently '{status}', not 'planned'. Execution is intended to run after planning. Do you want to proceed anyway?"
   - Wait for explicit confirmation before continuing if the `status-ticket` label is not 'planned'
   - Read the issue `description` field — this is the ticket content
   - Fetch all documents linked to the issue following the PM skill's document retrieval pattern:
      - List all documents for the issue
      - Retrieve each document's full content
   - **Identify the plan document** by finding the document whose `title` starts with `"Plan:"`.
      - If NO such document exists, **stop immediately** and inform the user:
        > "No plan document was found on issue {issue_id}. Cannot proceed with execution. Please run /plan first."
      - Do not proceed until a plan document is confirmed present.
   - Treat all other documents (research, prior artefacts) as additional context.
    - **IMPORTANT**: Do not read any local `thoughts/` files as inputs.
    - **Detect pathway context:**
      - Load the workbench-context skill: `skill({ name: 'workbench-context' })`
      - Check if `.workbench/config.yaml` exists in the repository root
        - If present: pathway_mode = "configured" (Pathway 2)
        - If absent: pathway_mode = "workbench" (Pathway 1)
      - Run `which ck` via Bash to check if ck CLI is installed
      - If installed, run `ck --status` to verify index readiness
      - On ck failure: warn the user and continue (graceful degradation)
      - Store resolved pathway_mode and ck_available for all downstream agent prompts

2. **Read the plan completely** from the plan document content. Check for any execution notes document from a prior partial run (title starts with `"Execution Notes:"`). If one exists, read it to understand what was already completed — trust completed phases and pick up from the first incomplete item.

3. **Consider the steps involved in the plan.** Think deeply about how the pieces fit together and derive a detailed todo list from the plan's phases and requirements.

4. **Implement each phase sequentially**, adapting to what you find while following the plan's intent.
   - Consider pathway context when determining which files to modify and how to search for relevant code

5. **Verify each phase** using the success criteria checks (usually `bun run check` covers everything). Fix any issues before proceeding.

6. **Maintain execution notes throughout the run.**
   Write or update `thoughts/executions/{issue_id}_execution_notes.md` to record:
   - Phases completed and any deviations encountered
   - Discoveries made during implementation
   - Decisions taken that differ from the plan

   At the end of execution, create a document for the issue following the PM skill's document creation pattern:
   - Title: `"Execution Notes: {issue_id}"`
   - Content: the full markdown content of the execution notes file

7. **Handle any mismatches or issues** by presenting them clearly and asking for guidance if needed.

8. **Set status to 'implemented':**
   Update the status to 'implemented' following the status update protocol in the PM skill.

Use the todowrite tool to create a structured task list for the 8 steps above, marking each as pending initially. Note that Step 3 may expand into multiple implementation subtasks derived from the plan.

**issue_id**

$ARGUMENTS
