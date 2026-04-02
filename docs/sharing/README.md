# Claude Code Setup - Shareable Configs

Ready-to-use Claude Code configurations. Pick one or both:

## 1. [Global Setup](global-setup/README.md)
Works across **every project** on your machine. Gives Claude consistent workflow rules, safety guardrails, code style, and technical preferences.

**Time to set up:** ~2 minutes
**What you get:** 4 files in `~/.claude/`

## 2. [GrowPod Project Setup](growpod-setup/README.md)
Project-specific config for the GrowPod microgreen grow chamber website. Adds custom agents, slash-command skills, product data, and design rules.

**Time to set up:** ~3 minutes (after global setup)
**What you get:** 15 files in your project's `.claude/` folder

## Install Order

1. Do the **Global Setup** first — it's the foundation
2. Then do the **GrowPod Project Setup** if you're working on the GrowPod site

## How It Works

Claude Code automatically reads these files at the start of every session:
- `~/.claude/` files apply to **all projects** on your machine
- `.claude/` files in a project folder apply to **that project only**
- `CLAUDE.md` in the project root is the main project briefing

No plugins, no extensions, no config commands — just markdown files in the right folders.
