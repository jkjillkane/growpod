# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Pre-order website for **GrowPod** — a fully automated microgreen grow chamber powered by an ESP32 microcontroller. Single-page static site (vanilla HTML/CSS/JS) built with Vite.

## Dev Commands

```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run format    # Format all files with Prettier
```

## Architecture

Single-page site — all content lives in `index.html` with sections linked by anchor IDs:
- `#hero` → Hero with pre-order CTA and key stats (7-14 days, 90% water, ~12% CO2)
- `#problem` → Problem cards (imported food, no space, no time)
- `#how-it-works` → 4-step process + ESP32 architecture diagram
- `#features` → 6 feature cards (lights, irrigation, climate, CO2, hydroponics, ESP32)
- `#sustainability` → Carbon bar chart (5.2 vs 4.6 kg CO2e) + sustainability points
- `#compare` → Competitor comparison table
- `#use-cases` → Home, restaurant, school cards
- `#specs` → BOM table + SEN0193 sensor detail
- `#preorder` → Waitlist form (client-side only, no backend yet)

### Files
- `index.html` — All page content, semantic HTML, emoji icons (no image assets yet)
- `css/style.css` — Full stylesheet using CSS custom properties (green/gray palette in `:root`), mobile-first with breakpoints at 480/768/1024px
- `js/main.js` — Navbar scroll effect, mobile toggle, IntersectionObserver animations, form handler (shows success message, no actual submission)
- `vite.config.js` — Minimal config, root `.`, builds to `dist/`

### CSS Design System
Colour tokens: `--green-50` through `--green-900`, `--gray-50` through `--gray-900`. Spacing/radius/shadow tokens in `:root`. Font: Inter (Google Fonts). Components use `.btn`, `.btn-primary`, `.btn-outline`, `.section-tag`, `.section-header` patterns.

## Rules

Detailed rules are split into `.claude/rules/`:
- `project-overview.md` — Project context, tech stack, key pages
- `design-guidelines.md` — Visual and UX design rules
- `product-data.md` — Verified product data and competitor pricing
- `code-style.md` — Development standards and code quality

## Known Gaps
- No backend for the pre-order form (client-side only)
- No product images (placeholder shown)
- No price set yet (shows "Pre-Order")
- No analytics or SEO meta tags
