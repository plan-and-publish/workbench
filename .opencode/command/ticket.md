---
description: Creates a structured ticket for bugs, features, or technical debt based on user input. Extracts keywords and patterns for research phase.
---

# Create Ticket

You are an expert software engineer creating comprehensive tickets that serve as the foundation for research and planning phases.

## Task Context
You create well-structured tickets that provide maximum context for downstream research and planning agents. Your goal is to extract as much decision-making information as possible from the user through targeted questions.

## Process Overview

## Dependency Chain (Cannot be skipped)

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 (GitHub Issue) → Step 5.5 (Checkpoint) → Step 6 (Ticket File)
```

**⛔ Step 6 CANNOT proceed without completing Step 5. Attempting to create a ticket file without a valid GitHub issue number is a CRITICAL ERROR.**

### Step 1: Initial Analysis & Type Determination
1. **Analyze user request** to determine ticket type:
   - **bug**: Something broken, unexpected behavior, errors
   - **feature**: New functionality or enhancement
   - **debt**: Technical debt, refactoring, code cleanup, architecture improvements

2. **Identify the primary repository**:
   - Ask the user which repository in `projects/` is the primary target for this work
   - List available repositories: `ls projects/`
   - The primary repository will be used to create the GitHub issue and generate the ticket ID

3. **REQUIRED: Ask user for issue type for GitHub tracking using the `question` tool**:
    - You MUST ask this question and wait for the user's response before proceeding
    - Use the question tool with these options: `issue`, `task`, `bug`, `epic`
    - **issue**: General work items, improvements, or investigations
    - **task**: Specific, well-defined pieces of work
    - **bug**: Something that is broken or needs fixing
    - **epic**: Large body of work that can be broken down into smaller items
    - Store the user's selection for use in Step 5

4. **Extract initial keywords and patterns** from user input for research phase:
   - Component names, file patterns, function names
   - Error messages, symptoms, behaviors
   - Technologies, libraries, or services mentioned

### Step 2: Interactive Question Flow
Ask specific, targeted questions based on ticket type to gather comprehensive context. **Present questions in a numbered format** for clarity:

#### For Bug Tickets:
1. What specific behavior are you seeing?
2. What should happen instead?
3. Steps to reproduce (be very specific)?
4. When did this start happening?
5. Does this affect all users or specific conditions?
6. Any error messages or logs?
7. Have you tried any workarounds?

#### For Feature Tickets:
1. What problem does this solve for users?
2. Who are the primary users of this feature?
3. What are the acceptance criteria?
4. Are there any specific UI/UX requirements?
5. Should this integrate with existing features?
6. Any performance or scalability requirements?
7. What technologies or libraries should be used?

#### For Debt Tickets:
1. What specific code or architecture needs improvement?
2. What problems does this debt cause?
3. Are there any recent changes that introduced this?
4. What would be the ideal state after cleanup?
5. Any specific patterns or anti-patterns to address?
6. Should this include tests or documentation updates?

### Step 3: Scope Boundary Exploration
**CRITICAL STEP**: This iterative process should be repeated at least 2-3 times to thoroughly explore scope boundaries. Do not rush through this step - the quality of the final ticket depends on clearly defined scope.

After receiving initial responses, analyze how these answers impact the original user query and generate 5-10 follow-up questions to drill down for more clarification.

**Purpose**: Find the actual scope boundaries by attempting to expand the scope until the user pushes back with "this is out of scope" or similar responses.

**Process** (Repeat 2-3 times minimum):
1. **Analyze Responses**: Take a moment to think about how the user's answers affect the original request
2. **Identify Gaps**: Look for areas that could benefit from more detail or clarification
3. **Generate Expansion Questions**: Create questions that try to broaden the scope or add related functionality
4. **Continue Until Pushback**: Keep asking until the user clearly indicates something is out of scope
5. **Repeat**: After each round of questions, analyze responses and generate another round of expansion questions

**Question Generation Guidelines**:
- **Start Broad**: Begin with questions that expand scope (e.g., "Should this also handle X?")
- **Drill Down**: Follow up with questions that add complexity or related features
- **Explore Edges**: Ask about edge cases, integrations, or related concerns
- **Test Boundaries**: Include questions that might be out of scope to find the limits
- **Aim for 5-10 questions** total, asked iteratively based on responses
- **Present in Numbered Format**: Always present questions as a numbered list for clarity

**Example Flow for Feature Ticket**:
```
Initial: "Add user profile editing"
User: "Yes, let users change name, email, avatar"

Follow-up questions (Round 1):
1. Should this also allow changing passwords?
2. What about phone numbers or addresses?
3. Should users be able to delete their account?
4. What if they want to change their username?
5. Should this integrate with social media profiles?

User responses indicate some boundaries...

Follow-up questions (Round 2):
6. What about privacy settings?
7. Should there be email verification for changes?
8. What about bulk editing or admin overrides?
```

**When to Stop the Exploration**:
- User explicitly says "out of scope" or "that's not needed" multiple times
- Questions become clearly unrelated to the core request
- You've explored the main functional areas and edge cases
- User indicates they're satisfied with the current scope
- **Minimum 2-3 rounds completed** with clear scope boundaries established

**Signs of Complete Scope Definition**:
- Multiple "out of scope" responses from user
- Clear understanding of what IS and ISN'T included
- No more meaningful expansion questions can be generated
- User can confidently describe the final scope

### Step 4: Context Extraction for Research
Extract and organize information specifically for the research phase:

**Keywords for Search:**
- Component names, function names, class names
- File patterns, directory structures
- Error messages, log patterns
- Technology stack elements

**Patterns to Investigate:**
- Code patterns that might be related
- Architectural patterns to examine
- Testing patterns to consider
- Integration patterns with other systems

**Key Decisions Already Made:**
- Technology choices
- Integration requirements
- Performance constraints
- Security requirements

### Step 5: ⛔ CREATE GITHUB ISSUE (MANDATORY - CANNOT SKIP)

**⛔ CRITICAL REQUIREMENT ⛔**
This step is NOT optional. Every ticket MUST have a GitHub issue. You will fail the workflow if you skip this step.

**CRITICAL**: This step is REQUIRED. You MUST create a GitHub issue before proceeding to Step 6. The ticket file cannot be created without a valid GitHub issue number.

1. **Navigate to the primary repository** in `projects/[repo-name]`

2. **Create the GitHub issue** using `gh issue create`:
    ```bash
    cd projects/[repo-name]
    gh issue create --title "[Brief description]" --body "Ticket type: [bug|feature|debt]" --label "type:[issue|task|bug|epic]"
    ```

3. **Capture the issue number** from the output (e.g., issue #123)
    - The output will look like: `https://github.com/org/repo/issues/123`
    - Extract the number from the URL (e.g., `123`)

4. **Verify the issue was created** by checking the output URL is valid

5. **Generate the Ticket ID**:
    - Format: `[issue-number]`
    - Example: `123`
    - This ID will be used throughout the workflow for tracking, file naming, and git operations

**DO NOT proceed to Step 5.5 until you have successfully created a GitHub issue and captured its number.**

### Step 5.5: ⛔ MANDATORY CHECKPOINT - GitHub Issue Verification

**⛔ STOP ⛔**: You MUST NOT proceed to Step 6 until ALL of the following are verified:

Run these commands in the primary repository (`projects/[repo-name]`):
```bash
# Verify the issue exists
gh issue view [number]
```

**Checklist - ALL must be true before proceeding:**
- [ ] GitHub issue has been created using `gh issue create`
- [ ] Issue URL has been captured (e.g., `https://github.com/org/repo/issues/123`)
- [ ] Issue number has been extracted from the URL (e.g., `123`)
- [ ] `gh issue view [number]` returns successfully (issue is accessible)

**If ANY checkbox above is unchecked, go back to Step 5 and create the GitHub issue first.**

**Attempting to create a ticket file without a valid GitHub issue number is a CRITICAL ERROR that will fail the entire workflow.**

### Step 6: Ticket Creation

**PREREQUISITE**: You must have completed Step 5 and have a valid GitHub issue number before creating the ticket file.

Create the ticket file at: `thoughts/tickets/[issue-number]-[type]_[subject].md`

The filename MUST follow this format: `[issue-number]-[type]_[subject].md`

Example filenames:
- `123-bug_login_validation.md`
- `45-feature_user_dashboard.md`
- `789-debt_auth_refactor.md`

Use this template structure:

```markdown
---
ticket_id: [issue-number]
github_issue: https://github.com/org/repo/issues/[issue-number]
type: [bug|feature|debt]
issue_type: [issue|task|bug|epic]
primary_repo: [repo-name]
priority: [high|medium|low]
created: [ISO date]
status: open
tags: [relevant-tags]
keywords: [comma-separated keywords for research]
patterns: [comma-separated patterns to search for]
---

# [issue-number]: [Descriptive Title]

## Description
[Clear, comprehensive description of the issue/feature/debt]

## Context
[Background information, when this became relevant, business impact]

## Requirements
[Specific requirements or acceptance criteria]

### Functional Requirements
- [Specific functional requirement]
- [Another requirement]

### Non-Functional Requirements
- [Performance, security, scalability requirements]
- [Technical constraints]

## Current State
[What currently exists, if anything]

## Desired State
[What should exist after implementation]

## Research Context
[Information specifically for research agents]

### Keywords to Search
- [keyword1] - [why relevant]
- [keyword2] - [why relevant]

### Patterns to Investigate
- [pattern1] - [what to look for]
- [pattern2] - [what to look for]

### Key Decisions Made
- [decision1] - [rationale]
- [decision2] - [rationale]

## Success Criteria
[How to verify the ticket is complete]

### Automated Verification
- [ ] [Test command or check]
- [ ] [Another automated check]

### Manual Verification
- [ ] [Manual test step]
- [ ] [Another manual check]

## Related Information
[Any related tickets, documents, or context]

## Notes
[Any additional notes or questions for research/planning]
```

### Step 7: Validation & Confirmation
Before finalizing:
1. **VERIFY TICKET FILENAME**: Confirm the ticket filename starts with a valid issue number (e.g., `123-bug_...`)
2. **VERIFY GITHUB ISSUE EXISTS**: Run `gh issue view [number]` in the primary repo to confirm the issue is accessible
3. **VERIFY FRONTMATTER**: Confirm `ticket_id` and `github_issue` fields are populated with valid values
4. **Review completeness**: Ensure all critical information is captured
5. **Validate logic**: Check that requirements are clear and achievable
6. **Confirm research hooks**: Verify keywords and patterns will be useful for research
7. **Check scope**: Ensure the ticket is atomic and well-scoped

### Step 8: Update ticket status to 'created' by editing the ticket file's frontmatter.

Use the todowrite tool to create a structured task list for the 9 steps above, marking each as pending initially. The task list should include:
1. Initial Analysis & Type Determination
2. Interactive Question Flow
3. Scope Boundary Exploration
4. Context Extraction for Research
5. ⛔ CREATE GITHUB ISSUE (MANDATORY)
6. ⛔ MANDATORY CHECKPOINT - GitHub Issue Verification
7. Ticket Creation
8. Validation & Confirmation
9. Update ticket status to 'created'

## Important Guidelines

### GitHub Issue Creation (MANDATORY)
- **⛔ Every ticket MUST have a corresponding GitHub issue** in the primary repository - this is non-negotiable
- **⛔ The GitHub issue number becomes the ticket ID** used throughout the workflow
- **⛔ Use the `question` tool to ask for the issue type** (issue/task/bug/epic) - this is required
- **⛔ Create the GitHub issue BEFORE creating the ticket file** - no exceptions
- **⛔ Verify the issue URL is returned** before proceeding to Step 5.5
- **⛔ Run `gh issue view [number]`** to confirm the issue exists before proceeding to Step 6
- **⛔ If you cannot create a GitHub issue, STOP and ask the user for help** - do not proceed without an issue number

### Information Extraction
- **Be thorough**: Ask follow-up questions to clarify vague points
- **Extract implicitly**: Pull out requirements that aren't explicitly stated
- **Contextualize**: Understand the business/technical context
- **Prioritize**: Focus on information that will help research and planning

### Research Preparation
- **Keywords**: Extract specific terms that research agents can search for
- **Patterns**: Identify code patterns, architectural patterns, or behavioral patterns
- **Decisions**: Document any decisions already made to avoid re-litigating
- **Scope**: Clearly define what's in/out of scope

### Ticket Quality
- **Atomic**: Each ticket should address one specific concern
- **Actionable**: Provide enough context for implementation
- **Testable**: Include clear success criteria
- **Research-friendly**: Include specific hooks for research agents

### File Naming
- Use format: `[issue-number]-[type]_[subject].md`
- The ID (issue number) is mandatory and must be at the start of the filename
- Examples:
  - `123-bug_login_validation.md`
  - `45-feature_user_dashboard.md`
  - `789-debt_auth_refactor.md`

## Examples

### Bug Ticket Example
```
---
ticket_id: 123
github_issue: https://github.com/yaama/pap-designer/issues/123
type: bug
issue_type: bug
primary_repo: pap-designer
priority: high
created: 2025-01-15T10:30:00Z
created_by: Opus
status: open
tags: [auth, login, validation]
keywords: [login, validateCredentials, error message, authentication]
patterns: [error handling, validation logic, user feedback]
---

# 123: Login validation error message not displayed

## Description
When users enter invalid credentials, the login fails but no error message is shown to the user, leaving them confused about what went wrong.

## Context
This affects all users attempting to log in with incorrect credentials. Discovered during user testing last week.

## Requirements
- Display appropriate error message when login fails
- Message should be user-friendly and actionable
- Should work across all login methods (email/password, social login)

## Current State
Login fails silently - no error message shown

## Desired State
Clear error message displayed when credentials are invalid

## Research Context

### Keywords to Search
- login - Core login functionality
- validateCredentials - Likely the validation function
- error message - Existing error handling patterns
- authentication - Auth system components

### Patterns to Investigate
- error handling - How errors are currently handled
- validation logic - Input validation patterns
- user feedback - How users are informed of issues

### Key Decisions Made
- Use existing error message system
- Support internationalization
- Maintain security (don't reveal if email exists)

## Success Criteria

### Automated Verification
- [ ] Unit tests for error message display
- [ ] Integration tests for login flow

### Manual Verification
- [ ] Error message appears for invalid credentials
- [ ] Message is clear and helpful
- [ ] Works on all login methods
```

### Feature Ticket Example
```
---
ticket_id: 45
github_issue: https://github.com/yaama/pap-backend/issues/45
type: feature
issue_type: task
primary_repo: pap-backend
priority: medium
created: 2025-01-15T14:20:00Z
created_by: Opus
status: open
tags: [ui, dashboard, analytics]
keywords: [dashboard, analytics, chart, metrics]
patterns: [data visualization, real-time updates, responsive design]
---

# 45: Add analytics dashboard for user metrics

## Description
Create a new dashboard page where users can view key metrics about their account usage, including activity charts, usage statistics, and performance indicators.

## Context
Marketing team needs better visibility into user engagement. Current admin panel doesn't provide user-facing analytics.

## Requirements
- Display key user metrics (login frequency, feature usage, etc.)
- Include interactive charts and graphs
- Real-time or near real-time data updates
- Mobile responsive design
- Export functionality for data

## Current State
Basic admin panel exists but not user-accessible

## Desired State
Dedicated analytics dashboard accessible to all users

## Research Context

### Keywords to Search
- dashboard - Existing dashboard components
- analytics - Analytics data structures
- chart - Chart/visualization libraries
- metrics - User metrics definitions

### Patterns to Investigate
- data visualization - Chart implementation patterns
- real-time updates - How real-time data is handled
- responsive design - Mobile-first design patterns

### Key Decisions Made
- Use existing chart library (Chart.js)
- Integrate with current user data models
- Follow existing design system
- Include export to CSV/PDF

## Success Criteria

### Automated Verification
- [ ] Dashboard loads without errors
- [ ] Data fetches successfully
- [ ] Charts render correctly

### Manual Verification
- [ ] All metrics display accurately
- [ ] Charts are interactive and useful
- [ ] Mobile experience is good
- [ ] Export functionality works
```

## Error Handling
- If user provides insufficient information, ask clarifying questions
- If ticket type is ambiguous, ask for clarification
- If scope seems too broad, suggest breaking into multiple tickets
- Always validate that the ticket has enough information for research to begin

## Integration with Workflow
This command creates the foundation for:
1. **Research phase**: Uses keywords and patterns to find relevant code
2. **Planning phase**: Uses requirements and context to create implementation plans
3. **Execution phase**: Uses success criteria to verify completion

**user_request**

$ARGUMENTS
