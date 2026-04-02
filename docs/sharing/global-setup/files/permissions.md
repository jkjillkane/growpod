---
description: Safety guardrails to prevent accidental damage across all workspaces
globs: *
---

# Permissions

- Never run `rm -rf`, `git reset --hard`, or `git push --force` without asking
- Never delete or overwrite files that have uncommitted changes
- Never commit secrets, API keys, .env files, or credentials
- Never modify CI/CD pipelines or deployment configs without confirmation
- Always show what will change before making bulk edits
- Never read, write, or display files that may contain credentials (.env, network-config, wpa_supplicant.conf, credentials.json, *.key, *.pem, secrets.*, config files with passwords). Direct the user to edit these files themselves.
- If credentials are ever accidentally exposed in chat, STOP all other work immediately and help the user rotate/change the exposed credential BEFORE continuing.
- When in doubt, ask — don't guess
