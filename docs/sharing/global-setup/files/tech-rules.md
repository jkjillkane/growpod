---
description: Global technical rules applied across all workspaces
globs: "*.{html,css,js,ts,jsx,tsx,json}"
---

# Tech Rules

- Use semantic HTML elements (nav, main, section, article, footer)
- Mobile-first CSS — start with small screens, add breakpoints up
- Prefer vanilla JS unless a framework is already in the project
- Use ES modules (import/export) not CommonJS (require)
- Keep dependencies minimal — don't add packages for things that are easy to write
- Always use relative units (rem, em, %) over fixed pixels where practical
- When starting a dev server for a new project, assign a unique localhost port (not 3000 or 3001). Pick a random port between 3100-3999 that isn't used by another project, and tell the user the port number automatically on first run
