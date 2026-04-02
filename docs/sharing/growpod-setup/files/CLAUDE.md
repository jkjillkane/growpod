# CLAUDE.md

## Project
Pre-order website for **GrowPod** — a fully automated microgreen grow chamber powered by an ESP32 microcontroller. Single-page static site (vanilla HTML/CSS/JS) built with Vite.

## Commands
npm run dev       # Start Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build
npm run format    # Format with Prettier

## Architecture
Single-page site — all content in `index.html` with sections linked by anchor IDs:
- `#hero` → Hero with pre-order CTA
- `#problem` → Problem cards
- `#how-it-works` → 4-step process + ESP32 diagram
- `#features` → 6 feature cards
- `#sustainability` → Carbon comparison chart
- `#compare` → Competitor table
- `#use-cases` → Home, restaurant, school
- `#specs` → BOM table + sensor detail
- `#preorder` → Waitlist form (submits via FormSubmit.co)

### Key Files
- `index.html` — All page content, semantic HTML
- `css/style.css` — CSS custom properties (green/gray palette), mobile-first, breakpoints at 480/768/1024px
- `js/main.js` — Navbar, mobile toggle, scroll animations, form submission
- `vite.config.js` — Minimal config

## Glossary
- **GrowPod** — the product
- **BOM** — Bill of Materials (components list)
- **ESP32** — the microcontroller powering the grow chamber
- **FormSubmit.co** — third-party form submission service (no backend)

## Known Gaps
- No backend — form uses FormSubmit.co
- No product images (placeholder only)
- No price set (shows "Pre-Order")
- No analytics or SEO meta tags

## Task Management
- Plans go in tasks/todo.md
- Lessons go in tasks/lessons.md
- Review both at session start

## Learning Notes
- Code explanations saved to docs/explanations/
- Quiz results saved to docs/learning/

## Rules
Detailed rules in `.claude/rules/`:
- `code-style.md` — Dev standards
- `design-guidelines.md` — Visual/UX rules
- `product-data.md` — Verified data and competitor pricing
- `project-overview.md` — Context and tech stack
