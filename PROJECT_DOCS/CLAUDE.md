# CLAUDE.md

READ CLAUDEBEHAVIOR.md

READ ASSIGNMENT.md
READ AND WRITE PROJECT_README.md WHEN NECESSARY
READ AND WRITE PROJECT_STRUCTURE.md WHEN NECESSARY

ASK BEFORE CHANGING CLAUDE.md
MUST FINALIZE PROJECT IDEA FIRST.
ONCE IDEA IS FINAL, FILL IN CLAUDE.md. ASK QUESTIONS. THINK DEEP. LOOK ONLINE.

EVERYTHING IN ~/github/AutomationProject/PROJECT_DOCS IS USED TO DOCUMENT AND PERSIST THE:
- PROJECT IDEA (SEE ASSIGNMENT.md FOR SPECIFICATIONS)
- PROJECT STRUCTURE (SEE ASSIGNMENT.md FOR SPECIFICATIONS)
- REQUIREMENTS.md (WILL BE CRAFTED WHEN PROJECT IDEA IS FINALIZED)
- IMPLEMENTATION PHASES (EVERYTHING IMPLEMENTED STEP BY STEP)
- TODO (ADD ALL TODOS TO TODO.md MOVE TO DONE.md WHEN DONE. ANALYZE AND ASK BEFORE MOVING TO DONE)
- LEAVE EXTRAS LAST. DO THESE WHEN THE CORE PROJECT IS FINISHED (SEE ASSIGNMENT.md)
- WORK STEP BY STEP !! STORAGE -> BACKEND -> FRONTEND
- FOLDER STRUCTURE ALREADY PRESENT. ANALYZE ~/github/AutomationProject/* AND FOLLOW STRUCTURE 

## Project
[One line: what this project does and who uses it]

## Stack  
[Framework, language, database, deployment target]

## Commands
- Dev: `[command]`
- Build: `[command]`
- Test single: `[command] -- [path]`
- Test all: `[command]`
- Lint: `[command]`
- Type check: `[command]`

## Architecture
- [folder] → [what lives here]
- [folder] → [what lives here]
- [folder] → [what lives here]
- [file] → [what this file does]

## Rules
- [Rule that prevents a specific mistake]
- [Rule that prevents a specific mistake]
- [Rule that prevents a specific mistake]
- IMPORTANT: [The one rule Claude keeps breaking]

## Workflow
- [How you want Claude to approach tasks]
- [Commit conventions]
- [Testing expectations]
- [When to ask vs when to act]

## Out of scope
- [Things Claude should not touch]
- [Files that are manually maintained]
- [Integrations Claude shouldn't modify]

## VERY IMPORTANT

- IMPORTANT: run type check after every code change
  (prevents Claude from shipping broken types)

- Make minimal changes, don't refactor unrelated code  
  (prevents Claude from rewriting your entire file)

- Create separate commits per logical change
  (prevents the 47-file monster commit)

- When unsure, explain both approaches and let me choose
  (prevents Claude from making architectural decisions for you)

- Static export only, no SSR
  (prevents Claude from adding server-side code to a static site)
