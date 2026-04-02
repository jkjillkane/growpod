# Claude Code Global Setup

This gives Claude Code a consistent personality and set of rules across **every project** on your machine. It takes about 2 minutes to set up.

## What You Get

- **Workflow rules** — Claude plans before coding, tracks lessons learned, verifies work before marking it done
- **Safety guardrails** — won't delete files, push to remote, or touch credentials without asking
- **Code style** — kebab-case files, camelCase JS, 2-space indent, single quotes, semicolons
- **Tech rules** — semantic HTML, mobile-first CSS, vanilla JS preferred, ES modules, minimal dependencies

## Quick Install

### 1. Create the folders

**Mac / Linux:**
```bash
mkdir -p ~/.claude/rules
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude\rules"
```

### 2. Copy the files

Copy these 4 files into the folders you just created:

```
~/.claude/
  CLAUDE.md              <-- copy from files/CLAUDE.md
  rules/
    permissions.md       <-- copy from files/permissions.md
    style-guide.md       <-- copy from files/style-guide.md
    tech-rules.md        <-- copy from files/tech-rules.md
```

That's it. Claude Code will automatically pick these up in every project.

### 3. (Optional) Create task tracking files

In each project where you use Claude Code, create a `tasks/` folder:

```bash
mkdir tasks
touch tasks/todo.md tasks/lessons.md
```

Claude will use these to track plans and learn from mistakes across sessions.

## What Each File Does

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Master instructions — workflow, principles, communication style |
| `rules/permissions.md` | Safety guardrails (no force push, no deleting without asking, no credential exposure) |
| `rules/style-guide.md` | Naming conventions and formatting rules |
| `rules/tech-rules.md` | Technical preferences (semantic HTML, mobile-first, vanilla JS) |

## Customising

These files are just markdown. Edit them to match your preferences:

- Don't like semicolons in JS? Change `style-guide.md`
- Prefer React over vanilla? Change `tech-rules.md`
- Want Claude to be more autonomous? Relax the rules in `permissions.md`
- Want different commit habits? Edit the Git Discipline section in `CLAUDE.md`
