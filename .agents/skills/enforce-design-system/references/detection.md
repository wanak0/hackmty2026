# Codebase detection

When the user picks "Scan codebase," detect the design system in this order. Stop at the first confident match.

## 1. Read `package.json`

Look at `dependencies` and `devDependencies` for these markers:

| Package | Implies |
|---|---|
| `@shadcn/ui` or presence of `components.json` at repo root | shadcn/ui |
| `@base-ui-components/react` or `@mui/base` | Base UI |
| `@radix-ui/react-*` (without shadcn) | Radix UI |
| `@mui/material` | MUI |
| `@chakra-ui/react` | Chakra |
| `tailwindcss` (with no component lib above) | Tailwind only |

If both shadcn and Radix are present, prefer **shadcn** (shadcn is built on Radix).
If both Tailwind and a component lib are present, the component lib wins.

## 2. Check for config files

- `components.json` → shadcn/ui (definitive)
- `tailwind.config.{js,ts,mjs}` → Tailwind is in use
- `theme.ts` exporting a Chakra theme → Chakra
- `.storybook/` with MUI imports → MUI

## 3. Spot-check imports

If `package.json` is ambiguous, grep three or four files in `src/` or `components/` for import statements. The most-imported UI library wins.

## 4. Check for a custom design system doc

Look for any of these files at the repo root or in `docs/`:

- `DESIGN_SYSTEM.md`
- `design-system.md`
- `charles.md`
- `STYLE_GUIDE.md`
- `CLAUDE.md` (may contain design rules)

If found, ask the user: "Found `<filename>` — use this as the design system source?" If yes, treat it as a custom design system and copy its content into `.claude/design-systems/custom.md`.

## 5. Report back

Tell the user what you found in plain language: "Detected shadcn/ui (found `components.json` and `@radix-ui/*` deps) plus Tailwind. Enforce both?"

If detection is uncertain, list the candidates and ask the user to pick.
