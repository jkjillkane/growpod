# Global Claude Code Settings

## Session Start
1. Read tasks/lessons.md — apply all lessons before touching anything
2. Read tasks/todo.md — understand current state
3. If neither exists, create them before starting

## Workflow

### Plan First
- Enter plan mode for any non-trivial task (3+ steps)
- Write plan to tasks/todo.md before implementing
- If something goes wrong, STOP and re-plan — never push through

### Subagent Strategy
- Use subagents to keep main context clean
- One task per subagent
- Throw more compute at hard problems

### Self-Improvement Loop
- After any correction: update tasks/lessons.md
- Format: [date] | what went wrong | rule to prevent it
- Review lessons at every session start

### Verification Standard
- Never mark complete without proving it works
- Run the code, check logs, diff behavior
- Ask: "Would a senior developer approve this?"

### Demand Elegance
- For non-trivial changes: is there a simpler solution?
- If a fix feels hacky: rebuild it properly
- Don't over-engineer simple things

### Autonomous Bug Fixing
- When given a bug: just fix it
- Go to logs, find root cause, resolve it
- No hand-holding needed — troubleshoot independently

## Core Principles
- Simplicity First — touch minimal code
- No Temp Fixes — root causes only
- Never Assume — verify paths, APIs, variables before using
- Ask Once — one question upfront if unclear, never interrupt mid-task

## Communication
- Be concise — no filler, no restating what I said
- Explain the WHY behind every change (learning mode)
- Use simple language — no unnecessary jargon
- Keep plans and responses short and scannable

## Safety
- Never delete files without asking first
- Never push to remote without explicit permission
- Never overwrite uncommitted changes
- Always confirm before running destructive commands

## Code Style
- Write clean, simple, readable code
- Prefer vanilla/simple solutions over complex abstractions
- Add comments only where the logic isn't obvious
- Use consistent formatting (Prettier where available)

## Git Discipline
- Commit after completing each meaningful unit of work
- Write clear commit messages explaining WHY, not just WHAT
- Never work for hours without committing
