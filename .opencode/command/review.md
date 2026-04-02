---
description: Review the execution of a Linear issue's plan. Provide a Linear issue ID as the argument. Best run after execution is complete.
---

# Review Plan

You are tasked with validating that an implementation plan was correctly executed, verifying all success criteria and identifying any deviations or issues.

You will be given a Linear issue ID. You will fetch the ticket, plan, and execution notes from Linear and validate that the implementation matches the plan.

## Validation Process

### Step 1: Context Discovery

1. **Check status-ticket label and fetch all context from Linear:**
   - Call `linear_get_issue` with the provided issue ID
   - Inspect the `labels[]` array. If the `status-ticket` group value is NOT `implemented`, surface this to the user:
     > "The status-ticket label is currently `{value}`, not `implemented`. Review is intended to run after execution. Do you want to proceed anyway?"
   - Wait for explicit confirmation before continuing if the label is not `implemented`
   - Read the issue `description` field — this is the ticket content
   - Fetch all documents linked to the issue:
      - Call `linear_list_documents` with the issue ID to list documents associated with it
      - For each document, call `linear_get_document` with the document `id` to retrieve its content
   - Identify key documents by their `title` prefix:
     - Plan: `title` starts with `"Plan:"`
     - Execution Notes: `title` starts with `"Execution Notes:"`
     - Research: `title` starts with `"Research:"`
   - Use the plan and execution notes as the primary review context. Research is supplementary.
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

2. **Identify what should have changed**:
   - List all files that should be modified according to the plan
   - Note all success criteria (automated and manual)
   - Identify key functionality to verify

3. **Identify actual changes by examining the codebase:**
    - Use the **codebase-locator** task to find all files related to the components that were supposed to change
    - Use the **codebase-analyzer** task to understand what the implementation actually does
    - **Include pathway context** when spawning codebase-locator and codebase-analyzer agents
    - Compare actual implementation to plan specifications
   - Return file-by-file comparison of planned vs actual

### Step 2: Systematic Validation

For each phase in the plan:

1. **Check completion status**:
   - Look for checkmarks in the plan (- [x])
   - Verify the actual code matches claimed completion

2. **Run automated verification**:
   - Execute each command from "Automated Verification"
   - Document pass/fail status
   - If failures, investigate root cause

3. **Assess manual criteria**:
   - List what needs manual testing
   - Provide clear steps for user verification

4. **Think deeply about edge cases**:
   - Were error conditions handled?
   - Are there missing validations?
   - Could the implementation break existing functionality?

### Step 3: Generate Validation Report

Create comprehensive validation summary and:

1. **Write the local file** to `thoughts/reviews/{issue_id}_{plan_name}_review.md`
   (e.g. `thoughts/reviews/PAP-7003_amend_agentic_commands_review.md`)
   This is a convenience copy only — it must not be used as input by any command.

   2. **Create a Linear document for the issue**:
      - Call `linear_create_document` with:
         - `issue`: the Linear issue ID
         - `title`: `"Review: {issue_id} - {plan_name}"`
         - `content`: the full markdown content of the review

Use this report structure:

```markdown
## Validation Report: [Plan Name]

### Implementation Status
✓ Phase 1: [Name] - Fully implemented
✓ Phase 2: [Name] - Fully implemented
⚠️ Phase 3: [Name] - Partially implemented (see issues)

### Automated Verification Results
✓ Build passes: `turbo build`
✓ Tests pass: `turbo test`
✗ Linting issues: `turbo check` (3 warnings)

### Code Review Findings

#### Matches Plan:
- Database migration correctly adds [table]
- API endpoints implement specified methods
- Error handling follows plan

#### Deviations from Plan:
- Check the plan's "## Deviations" section (if present)
- For each deviation noted:
  - **Phase [N]**: [Original plan vs actual implementation]
  - **Assessment**: [Is the deviation justified? Impact on success criteria?]
  - **Recommendation**: [Any follow-up needed?]
- Additional deviations found during review:
  - Used different variable names in [file:line]
  - Added extra validation in [file:line] (improvement)

#### Potential Issues:
- Missing index on foreign key could impact performance
- No rollback handling in migration

### Manual Testing Required:
1. UI functionality:
   - [ ] Verify [feature] appears correctly
   - [ ] Test error states with invalid input

2. Integration:
   - [ ] Confirm works with existing [component]
   - [ ] Check performance with large datasets

### Recommendations:
- Address linting warnings before merge
- Consider adding integration test for [scenario]
- Document new API endpoints
```

### Step 4: Set status-ticket label to 'reviewed'

Using the label preservation protocol:
1. Call `linear_get_issue` to get the current `labels[]` array
2. Remove any existing `status-ticket` group value
3. Append `"reviewed"` to the array
4. Call `linear_save_issue` with the full updated labels array

Use the todowrite tool to create a structured task list for the 4 steps above, marking each as pending initially.

## Working with Existing Context

- Review the conversation history
- Check your todo list for what was completed
- Focus validation on work done in this session
- Be honest about any shortcuts or incomplete items

## Important Guidelines

1. **Be thorough but practical** - Focus on what matters
2. **Run all automated checks** - Don't skip verification commands
3. **Document everything** - Both successes and issues
4. **Think critically** - Question if the implementation truly solves the problem
5. **Consider maintenance** - Will this be maintainable long-term?
6. **Do not use task subagents** - All review work should be done exclusively in the main context to maintain consistency and avoid fragmentation

## Validation Checklist

Always verify:
- [ ] All phases marked complete are actually done
- [ ] Automated tests pass
- [ ] Code follows existing patterns
- [ ] No regressions introduced
- [ ] Error handling is robust
- [ ] Documentation updated if needed
- [ ] Manual test steps are clear

The validation works best after commits are made, as it can analyze the git history to understand what was implemented.

Remember: Good validation catches issues before they reach production. Be constructive but thorough in identifying gaps or improvements.

**issue_id**

$ARGUMENTS
