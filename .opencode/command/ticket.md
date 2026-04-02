---
description: Creates a structured ticket for a Linear issue. Provide a Linear issue ID as the argument.
---

# Create Ticket

You are an expert software engineer creating comprehensive tickets that serve as the foundation for research and planning phases.

## Task Context
You create well-structured tickets that provide maximum context for downstream research and planning agents. Your goal is to extract as much decision-making information as possible from the user through targeted questions.

## Process Overview

### Step 1: Read the Linear Issue

1. Call `linear_get_issue` with the provided issue ID to fetch the issue title, description, and current labels.
2. If the issue has a parent, call `linear_get_issue` on the parent ID to read the parent description for broader context. Do not duplicate parent-level content in the ticket — use it only to understand the wider scope.
3. Use the fetched content as the starting context for the Q&A. The existing issue description (if any) is the raw input from the user; treat it as prior context, not the final ticket.
4. **Detect pathway context:**
   - Load the workbench-context skill: `skill({ name: 'workbench-context' })`
   - Check if `.workbench/config.yaml` exists in the repository root
     - If present: pathway_mode = "configured" (Pathway 2)
     - If absent: pathway_mode = "workbench" (Pathway 1)
   - Run `which ck` via Bash to check if ck CLI is installed
   - If installed, run `ck --status` to verify index readiness
   - On ck failure: warn the user and continue
   - Store pathway_mode for ticket metadata inclusion

### Step 2: Interactive Question Flow

Ask specific, targeted questions based on what the issue is about. Present questions in a numbered format for clarity. Focus on:
- What problem does this solve?
- What is the expected behaviour / desired end state?
- What are the acceptance criteria?
- Are there integration, performance, or security constraints?
- What is explicitly out of scope?

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

### Step 5: Write the Ticket

Once the Q&A and scope exploration are complete:

1. Produce the final ticket document using this structure:

   ```markdown
   # [Descriptive Title]

   ## Description
   [Clear, comprehensive description]

   ## Context
   [Background and business impact]

   ## Requirements

   ### Functional Requirements
   - [Requirement]

   ### Non-Functional Requirements
   - [Constraint]

   ## Current State
   [What currently exists]

   ## Desired State
   [What should exist after implementation]

   ## Research Context

   ### Keywords to Search
   - [keyword] - [why relevant]

   ### Patterns to Investigate
   - [pattern] - [what to look for]

    ### Key Decisions Made
    - [decision] - [rationale]

    ### Environment Context
    - Pathway mode: [configured | workbench]
    - ck CLI available: [true | false]

   ## Success Criteria

   ### Automated Verification
   - [ ] [Test command or check]

   ### Manual Verification
   - [ ] [Manual test step]
   ```

2. **Overwrite the Linear issue description** with the full ticket content:
   - Call `linear_save_issue` with `id: {issue_id}` and `description: {full ticket content}`

3. **Save a local convenience copy** to `thoughts/tickets/{issue_id}_{subject}.md` using the Write tool.
   This file must never be used as an input by any downstream command.

### Step 6: Validation & Confirmation
Before finalizing:
1. **Review completeness**: Ensure all critical information is captured
2. **Validate logic**: Check that requirements are clear and achievable
3. **Confirm research hooks**: Verify keywords and patterns will be useful for research
4. **Check scope**: Ensure the ticket is atomic and well-scoped

### Step 7: Set status-ticket label to 'open'

Using the label preservation protocol:
1. Call `linear_get_issue` to get the current `labels[]` array
2. Remove any existing `status-ticket` group value (open/researched/planned/implemented/reviewed)
3. Append `"open"` to the array
4. Call `linear_save_issue` with `labels: [<all preserved non-status labels>, "open"]`

Use the todowrite tool to create a structured task list for the 7 steps above, marking each as pending initially.

## Important Guidelines

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
- Local convenience copy: `thoughts/tickets/{issue_id}_{snake_case_subject}.md`
- Example: `thoughts/tickets/PAP-7003_amend_agentic_commands.md`

## Error Handling
- If user provides insufficient information, ask clarifying questions
- If scope seems too broad, suggest breaking into multiple tickets
- Always validate that the ticket has enough information for research to begin

## Integration with Workflow
This command creates the foundation for:
1. **Research phase**: Uses keywords and patterns to find relevant code
2. **Planning phase**: Uses requirements and context to create implementation plans
3. **Execution phase**: Uses success criteria to verify completion

**user_request**

$ARGUMENTS
