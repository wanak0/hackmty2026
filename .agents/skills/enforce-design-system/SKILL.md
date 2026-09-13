---
name: enforce-design-system
description: Audit a codebase against a design system and report what doesn't follow it — raw HTML where components should be used, hardcoded colors and spacing instead of tokens, inline styles and arbitrary Tailwind values, accessibility basics, and component API misuse. Use this skill whenever the user runs `/enforce-design-system`, asks to audit, lint, or check their code against a design system, mentions design system compliance, asks "is this on-brand," wants to find raw HTML or hardcoded values, asks to enforce shadcn / Base UI / Tailwind / Radix / MUI / Chakra conventions, or wants to make sure new pages follow design system rules. Trigger this even if they don't say "design system" — phrases like "is this using our components," "find inline styles," or "audit my UI code" all qualify.
---

# Enforce Design System

A read-only audit that compares the codebase against a chosen design system and reports violations grouped by category. The skill never edits files on its own — it surfaces findings, then asks the user whether to fix them.

## Slash command

This skill is invoked by `/enforce-design-system`. When triggered, walk the user through the steps below in order.

## Step 1 — Pick a design system

Ask the user which design system to enforce. Present these options as a numbered list:

1. **shadcn/ui**
2. **Base UI** (Mui Base / Vercel's Base UI)
3. **Tailwind CSS** (utility conventions, no component lib)
4. **Radix UI**
5. **MUI** (Material UI)
6. **Chakra UI**
7. **Custom URL** — user pastes a URL or local path to design system docs/instructions
8. **Scan codebase** — auto-detect existing design system from `package.json`, imports, and config files

If the user picks **Scan codebase**, run the detection logic in `references/detection.md`. After detecting, confirm the result with the user before proceeding ("Looks like you're using shadcn/ui + Tailwind — enforce that?").

## Step 2 — Load the design system rules (with caching)

Rules are cached at `.claude/design-systems/<name>.md` in the repo root. Cache behavior:

- **If a cache file exists for the chosen system AND the user did not supply a new URL** → use the cache.
- **If the user supplies a URL or path different from what's cached** → fetch fresh, overwrite the cache, and use the new version.
- **If no cache exists** → fetch and write a new cache file.

For the built-in presets (1–6), the rule sets live in `references/<preset>.md` inside the skill itself. Copy from there into the cache on first use.

For **Custom URL**: fetch the URL (or read the local path), extract the relevant rules, and write to `.claude/design-systems/custom.md`. If the URL is a docs site, follow links one level deep to capture component conventions, tokens, and dos/don'ts.

Always tell the user which cache file you're using ("Loaded shadcn rules from `.claude/design-systems/shadcn.md`") so they know where to edit if they want to customize.

## Step 3 — Determine scope

Default scope is the **whole repo**. If the user specified a path in the original request (e.g. `/enforce-design-system src/app/dashboard`), audit that path only. Otherwise, audit everything under common UI directories (`src/`, `app/`, `components/`, `pages/`) — skip `node_modules`, `.next`, `dist`, `build`, `.git`, and any path in `.gitignore`.

Tell the user the scope before scanning ("Auditing the whole repo — about 142 files. Continue?") so they can narrow it if needed.

## Step 4 — Run the checks

Run all five check categories in a single pass per file. For each violation, capture: file path, line number, the offending snippet, and which rule it violates.

The five categories:

1. **Raw HTML vs components** — `<button>`, `<input>`, `<select>`, `<dialog>`, `<a>` styled as buttons, etc., where the design system has a component equivalent.
2. **Hardcoded colors/spacing vs tokens** — hex codes (`#1a1a1a`), `rgb(...)`, `rgba(...)`, raw pixel values in style props (`padding: '16px'`), Tailwind arbitrary color values (`bg-[#1a1a1a]`).
3. **Inline styles & arbitrary Tailwind values** — `style={{...}}` props, Tailwind arbitrary values like `w-[423px]`, `mt-[13px]`, `text-[#abc123]`.
4. **Accessibility basics** — missing `alt` on `<img>`, missing labels on form inputs, buttons with no accessible name, click handlers on non-interactive elements (`<div onClick>`), missing `type` on `<button>` inside forms.
5. **Component API misuse** — wrong variant names (e.g. `<Button variant="primary">` when shadcn uses `default`), invalid prop combinations, deprecated props.

Detailed rule lists for each category are in `references/checks.md`. Read it before scanning.

The exact "what counts as a violation" depends on the chosen design system — read the cached rules file and apply its conventions. For example, Tailwind allows arbitrary values in some teams' conventions but not others; defer to what the cached rules say.

## Step 5 — Report

Print results to the terminal grouped by category, with a summary header. Use this format:

```
Design System Audit — shadcn/ui
Scope: src/app/ (47 files)

━━━ Raw HTML vs components (8) ━━━
src/app/dashboard/page.tsx:42
  <button className="px-4 py-2 bg-blue-500">Save</button>
  → Use <Button> from @/components/ui/button

src/app/settings/form.tsx:18
  <input type="text" className="border rounded" />
  → Use <Input> from @/components/ui/input

━━━ Hardcoded colors/spacing (3) ━━━
src/components/header.tsx:7
  style={{ color: '#1a1a1a' }}
  → Use a token: text-foreground or text-zinc-900

[... etc ...]

━━━ Summary ━━━
Total violations: 23
Files affected: 11
```

Keep snippets short (one line of context). If a file has more than 10 violations of the same category, show the first 5 and note "... and 7 more in this file."

## Step 6 — Offer to fix

After the report, ask the user one question:

> Want me to fix these? I can fix all of them, a specific category, or specific files.

Wait for their answer. If they say yes:
- **All** → fix every violation, file by file. After each file, show a brief diff summary ("Fixed 4 violations in `src/app/dashboard/page.tsx`").
- **Category** → fix only that category across all files.
- **Files** → fix only those files, all categories.
- **No / skip** → end the audit, leave files untouched.

When fixing, prefer minimal edits. Don't reformat unrelated code, don't reorder imports beyond what's needed, don't change logic. If a fix is ambiguous (e.g. which `<Button>` variant matches the original styling), ask before applying it.

After fixing, run a quick re-scan of the touched files and confirm violations are resolved. Report any that couldn't be auto-fixed.

## Notes on edge cases

- **Storybook / fixture files** (`*.stories.*`, `*.fixture.*`): skip by default unless the user explicitly includes them. They often intentionally use raw HTML to demo components.
- **Generated files**: skip anything with a `// @generated` or `/* eslint-disable */` header at the top.
- **Test files** (`*.test.*`, `*.spec.*`): skip by default — test code commonly uses raw HTML for harness purposes.
- **Markdown / MDX**: skip unless the design system specifically covers MDX components.
- **`<a>` tags**: only flag when they're styled like buttons (have `bg-`, `border`, `rounded`, `px-`, `py-` Tailwind classes) — plain links are fine.
- **`<div>` and `<span>`**: never flag these as "raw HTML" — they're primitives, not component candidates.

## When the user has no design system at all

If detection finds nothing and the user picks no preset, tell them honestly: "I don't see a design system in this codebase. I can still audit for general best practices (a11y, inline styles, hardcoded values) — want me to?" Then run only categories 2, 3, and 4.
