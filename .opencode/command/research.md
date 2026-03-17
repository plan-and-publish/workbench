---
description: Research a Linear issue. Provide a Linear issue ID as the argument. Best run in a new session.
---

# Research Codebase

You are tasked with conducting comprehensive research across the codebase to answer user questions by spawning tasks and synthesizing their findings.

The user will provide a Linear issue ID. You will fetch the ticket from Linear and research the codebase accordingly.

## Steps to follow after receiving the research query:

1. **Check status-ticket label and fetch the ticket:**
   - Call `linear_get_issue` with the provided issue ID
   - Inspect the `labels[]` array. If the `status-ticket` group value is NOT `open`, surface this to the user:
     > "The status-ticket label is currently `{value}`, not `open`. Research is intended to run after the ticket phase. Do you want to proceed anyway?"
   - Wait for explicit confirmation before continuing if the label is not `open`
   - Read the issue `description` field — this is the ticket content
   - **IMPORTANT**: Do not read the ticket from any local file. The Linear issue description is the sole source of truth.

2. **Detail the steps needed to perform the research:**
    - Break down the user's ticket into composable research areas
    - Take time to think about the underlying patterns, connections, and architectural the ticket has provided
    - Identify specific components, patterns, or concepts to investigate
    - Lay out what the codebase-locator or thoughts-locator should look for
    - Specify what patterns the codebase-pattern-finder should look for
    - Be clear that locators and pattern-finders collect information for analyzers
    - Typically run a single codebase-analyzer and thoughts-analyzer (in parallel if both needed)
    - Consider which directories, files, or architectural patterns are relevant

3. **Spawn tasks for comprehensive research (follow this sequence):**
   
   **Phase 1 - Locate (Codebase & Thoughts):**
   - Identify all topics/components/areas you need to locate
   - Group related topics into coherent batches
   - Spawn **codebase-locator** agents in parallel for each topic group to find WHERE files and components live
   - Simultaneously spawn **thoughts-locator** agents in parallel to discover relevant documents
   - **WAIT** for all locator agents to complete before proceeding

   **Phase 2 - Find Patterns (Codebase only):**
   - Based on locator results, identify patterns you need to find
   - Use **codebase-pattern-finder** agents to find examples of similar implementations
   - Run multiple pattern-finders in parallel if searching for different unique patterns
   - **WAIT** for all pattern-finder agents to complete before proceeding

   **Phase 3 - Analyze (Codebase & Thoughts):**
   - Using information from locators and pattern-finders, determine what needs deep analysis
   - Group analysis tasks by topic/component
   - Spawn **codebase-analyzer** agents in parallel for each topic group to understand HOW specific code works
   - Spawn **thoughts-analyzer** agents in parallel to extract key insights from the most relevant documents found
   - **WAIT** for all analyzer agents to complete before synthesizing

   **Important sequencing notes:**
   - Each phase builds on the previous one - locators inform pattern-finding, both inform analysis
   - Run agents of the same type in parallel within each phase
   - Never mix agent types in parallel execution
   - Each agent knows its job - just tell it what you're looking for
   - Don't write detailed prompts about HOW to search - the agents already know

4. **Wait for all sub-agents to complete and synthesize findings:**
   - IMPORTANT: Wait for ALL sub-agent tasks to complete before proceeding
   - Compile all sub-agent results (both codebase and thoughts findings)
   - Prioritize live codebase findings as primary source of truth
   - Use thoughts/ findings as supplementary historical context
   - Connect findings across different components
   - Include specific file paths and line numbers for reference
   - Highlight patterns, connections, and architectural decisions
   - Answer the user's specific questions with concrete evidence

5. **Gather metadata for the research document:**

Use the following metadata for the research document body:

**metadata**

- Date: !`date -Iseconds`
- Branch: !`git branch --show-current`
- Commit: !`git rev-parse HEAD`
- Repository: !`basename $(git rev-parse --show-toplevel)`

6. **Generate research document:**
   - Filename: `thoughts/research/{issue_id}_{topic}.md`
     (e.g. `thoughts/research/PAP-7003_linear_integration.md`)
   - Write the local file using the Write tool
   - Structure WITHOUT YAML frontmatter — use a Metadata section in the body:

     ```markdown
     # Research: [Topic]

     ## Metadata
     - Date: [from step 5]
     - Branch: [from step 5]
     - Commit: [from step 5]
     - Repository: [from step 5]

     ## Ticket Synopsis
     [Synopsis of the ticket]

     ## Summary
     [High-level findings]

     ## Detailed Findings

     ### [Component/Area 1]
     - Finding with reference (`file.ext:line`)

     ## Code References
     - `path/to/file.ext:123` - Description

     ## Architecture Insights
     [Patterns and design decisions discovered]

     ## Historical Context (from thoughts/)
     [Relevant insights from thoughts/ directory]

     ## Open Questions
     [Areas needing further investigation]
     ```

   - After writing the local file, **attach it to the Linear issue**:
     1. Encode: `base64 < thoughts/research/{issue_id}_{topic}.md` via Bash tool
     2. Call `linear_create_attachment` with:
        - `issue`: the Linear issue ID
        - `base64Content`: the encoded string
        - `filename`: `{issue_id}_{topic}.md`
        - `contentType`: `"text/markdown"`
        - `title`: `"Research: {issue_id} - {topic}"`

7. **Present findings:**
   - Present a concise summary of findings to the user
   - Include key file references for easy navigation
   - Ask if they have follow-up questions or need clarification

8. **Handle follow-up questions:**
   - If the user has follow-up questions, conduct additional research and produce a new document
   - Use a sequenced filename: `{issue_id}_{topic}_part2.md`, `_part3.md`, etc.
   - Write the new local file to `thoughts/research/`
   - Attach the new file to the same Linear issue as a new attachment (never overwrite existing attachments):
     - `title`: `"Research: {issue_id} - {topic} (part N)"`
   - Do NOT use any prior local research file as input — always fetch context from the Linear issue and its attachments

9. **Set status-ticket label to 'researched':**
   Using the label preservation protocol:
   1. Call `linear_get_issue` to get the current `labels[]` array
   2. Remove any existing `status-ticket` group value
   3. Append `"researched"` to the array
   4. Call `linear_save_issue` with the full updated labels array

Use the todowrite tool to create a structured task list for the 9 steps above, marking each as pending initially.

## Important notes:
- Follow the three-phase sequence: Locate → Find Patterns → Analyze
- Use parallel Task agents OF THE SAME TYPE ONLY within each phase to maximize efficiency and minimize context usage
- Always run fresh codebase research - never rely solely on existing research documents
- The thoughts/architecture directory contains important information about the codebase details
- Focus on finding concrete file paths and line numbers for developer reference
- Research documents should be self-contained with all necessary context
- Each sub-agent prompt should be specific and focused on read-only operations
- Consider cross-component connections and architectural patterns
- Include temporal context (when the research was conducted)
- Keep the main agent focused on synthesis, not deep file reading
- Encourage sub-agents to find examples and usage patterns, not just definitions
- Explore all of thoughts/ directory, not just research subdirectory
- **File reading**: Always read mentioned files FULLY (no limit/offset) before spawning sub-tasks
- **Critical ordering**: Follow the numbered steps exactly
  - ALWAYS read mentioned files first before spawning sub-tasks (step 1)
  - ALWAYS wait for all sub-agents to complete before synthesizing (step 4)
  - ALWAYS gather metadata before writing the document (step 5 before step 6)
  - NEVER write the research document with placeholder values
- **Document structure**: Research documents use a Metadata section in the body (no YAML frontmatter)

**issue_id**

$ARGUMENTS
