---
description: Execute a specific implementation plan. Provide a plan file as the argument to this command. It's very important this command runs in a new session.
---

# Implement Plan

You are tasked with implementing an approved technical plan from `thoughts/plans/`. These plans contain phases with specific changes and success criteria.

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:
- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

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
- **Document deviations in the plan**: If proceeding with a change, update the plan file with a clear record of the deviation using the Edit tool. Add or update a section at the end of the plan:

  ```markdown
  ## Deviations from Plan

  ### Phase [N]: [Phase Name]
  - **Original Plan**: [brief summary of what the plan specified]
  - **Actual Implementation**: [what was actually done]
  - **Reason for Deviation**: [why the change was necessary]
  - **Impact Assessment**: [effects on other phases, success criteria, or overall project]
  - **Date/Time**: [when the deviation was made]
  ```

## Git Branch Management

Before making any code changes, you MUST set up the proper git branch for each repository:

### Step 0: Repository Setup (CRITICAL - Do this FIRST)

For each repository that will be modified during execution:

1. **Extract the ticket ID and issue name** from the plan file:
   - Ticket ID format: `[issue-number]` (e.g., `123`)
   - Issue name: derived from the ticket subject (without markup or invalid characters)
   - Branch name format: `feature/[issue-number]-[issue-name]`
   - Example: `feature/123-fix-login-validation`

2. **Navigate to the repository** in the `projects/` folder

3. **Stash any uncommitted changes and reset to main**:
   ```bash
   # Check current status
   git status
   
   # Stash any changes if present
   git stash push -m "stash-for-[branch-name]-$(date +%Y%m%d%H%M%S)"
   
   # Reset to main branch
   git checkout main
   git pull origin main
   ```

4. **Check for existing branch and create new branch**:
   ```bash
   # Check if branch already exists
   git branch -a | grep "feature/[issue-number]-[issue-name]"
   
   # If branch exists, add a number suffix
   # Example: feature/123-fix-login-validation-2
   
   # Create new feature branch
   git checkout -b feature/[issue-number]-[issue-name]
   ```

5. **Repeat for each affected repository**

## Commit Message Format

All commits MUST follow this format:
```
#[issue-number]-[change-title-or-quick-description]
```

Examples:
- `#123-add-validation-error-message`
- `#123-update-auth-service`
- `#45-add-dashboard-component`

## Verification Approach

After implementing a phase:
- Run the success criteria checks (usually `bun run check` covers everything)
- Fix any issues before proceeding
- Update your progress in both the plan and your todos
- Check off completed items in the plan file itself using Edit

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

1. **Read the plan completely** and check for any existing checkmarks (- [x]). Only read the plan file provided as an argument. Extract the `ticket_id` from the plan.

2. **Read the original ticket and all files mentioned in the plan**. Read files fully - never use limit/offset parameters, you need complete context. If you have trouble understanding the plan, refer to the research and ticket information.

3. **Identify all repositories that will be modified** based on the plan. For each repository:
   - Follow the Git Branch Management steps (Step 0 above)
   - Stash changes, reset to main, and create feature branch
   - Document the branch name created

4. **Consider the steps involved in the plan**. Think deeply about how the pieces fit together and derive a detailed todo list from the plan's phases and requirements.

5. **Implement each phase sequentially**, adapting to what you find while following the plan's intent.

6. **Create commits with proper format** as you complete logical units of work:
   - Commit message format: `#[issue-number]-[change-title-or-quick-description]`
   - Group related changes into single commits
   - Use the ticket ID from the plan in every commit

7. **Verify each phase** using the success criteria checks (usually `bun run check` covers everything). Fix any issues before proceeding.

8. **Update the plan file** with checkmarks for completed items using the Edit tool.

9. **Handle any mismatches or issues** by presenting them clearly and asking for guidance if needed.

10. **Update ticket status** to 'implemented' by editing the ticket file's frontmatter.

Use the todowrite tool to create a structured task list for the 10 steps above, marking each as pending initially. Note that Step 4 may expand into multiple implementation subtasks derived from the plan.

**plan**

$ARGUMENTS
