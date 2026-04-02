---
description: Global code formatting and naming conventions across all workspaces
globs: "*.{html,css,js,ts,jsx,tsx}"
---

# Style Guide

## Naming
- Files: kebab-case (e.g. `hero-section.js`, `main-styles.css`)
- CSS classes: kebab-case (e.g. `.hero-section`, `.nav-link`)
- JS variables/functions: camelCase (e.g. `getUserData`, `isVisible`)
- JS constants: UPPER_SNAKE_CASE (e.g. `API_URL`, `MAX_RETRIES`)

## Formatting
- 2-space indentation
- Single quotes in JS
- Semicolons in JS
- Max line length: 100 characters

## Structure
- Keep files small and focused — one component/module per file
- Group related files in folders
- CSS: group properties logically (layout, typography, visual)
