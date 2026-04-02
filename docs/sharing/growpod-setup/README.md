# GrowPod Project - Claude Code Setup

This configures Claude Code specifically for the GrowPod microgreen grow chamber website. It adds project-specific rules, custom agents, and slash-command skills on top of the global setup.

**Prerequisite:** Install the [Global Setup](../global-setup/README.md) first.

## What You Get

- **Project context** — Claude knows the product, tech stack, architecture, and competitors
- **6 custom agents** — code reviewer, planner, researcher, accessibility reviewer, security auditor, build validator
- **4 slash-command skills** — `/a11y-check`, `/seo-check`, `/perf-check`, `/security-check`
- **Design + product rules** — green/sustainable aesthetic, verified product data, competitor pricing

## Quick Install

### 1. Create the folder structure

From the root of your GrowPod project:

**Mac / Linux:**
```bash
mkdir -p .claude/rules .claude/agents .claude/skills/a11y-check .claude/skills/seo-check .claude/skills/perf-check .claude/skills/security-check tasks
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path ".claude\rules", ".claude\agents", ".claude\skills\a11y-check", ".claude\skills\seo-check", ".claude\skills\perf-check", ".claude\skills\security-check", "tasks"
```

### 2. Copy the files

Copy all the files from the `files/` folder into your project, matching this structure:

```
your-project/
  CLAUDE.md                          <-- files/CLAUDE.md
  .claude/
    rules/
      code-style.md                  <-- files/rules/code-style.md
      design-guidelines.md           <-- files/rules/design-guidelines.md
      product-data.md                <-- files/rules/product-data.md
      project-overview.md            <-- files/rules/project-overview.md
    agents/
      code-reviewer.md               <-- files/agents/code-reviewer.md
      planner.md                     <-- files/agents/planner.md
      researcher.md                  <-- files/agents/researcher.md
      a11y-reviewer.md               <-- files/agents/a11y-reviewer.md
      security-auditor.md            <-- files/agents/security-auditor.md
      test-deploy.md                 <-- files/agents/test-deploy.md
    skills/
      a11y-check/SKILL.md            <-- files/skills/a11y-check/SKILL.md
      seo-check/SKILL.md             <-- files/skills/seo-check/SKILL.md
      perf-check/SKILL.md            <-- files/skills/perf-check/SKILL.md
      security-check/SKILL.md        <-- files/skills/security-check/SKILL.md
  tasks/
    todo.md                          <-- create empty
    lessons.md                       <-- create empty
```

### 3. Create empty task files

```bash
touch tasks/todo.md tasks/lessons.md
```

That's it. Claude Code picks up everything automatically.

## How to Use the Agents

Agents run as subagents. Claude will use them automatically, or you can ask directly:

| Agent | When to Use |
|-------|-------------|
| `planner` | "Plan out how to add dark mode" |
| `code-reviewer` | "Review the changes I just made" |
| `researcher` | "Research best practices for form validation" |
| `a11y-reviewer` | "Check the site for accessibility issues" |
| `security-auditor` | "Run a security audit before deploy" |
| `test-deploy` | "Build and validate before deploying" |

## How to Use the Skills (Slash Commands)

Type these directly in Claude Code:

| Command | What It Does |
|---------|--------------|
| `/a11y-check` | WCAG accessibility audit |
| `/seo-check` | SEO meta tags and structured data audit |
| `/perf-check` | Performance review (render-blocking, bundle size) |
| `/security-check` | OWASP-aligned security audit |

## Customising

- **Product data changed?** Edit `.claude/rules/product-data.md`
- **New competitor?** Add them to the competitor table in `product-data.md`
- **Different tech stack?** Update `CLAUDE.md` and `.claude/rules/project-overview.md`
- **New section on the site?** Add it to the Architecture section in `CLAUDE.md`
