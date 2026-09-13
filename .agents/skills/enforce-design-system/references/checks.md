# Check rules

Detailed patterns for each of the five audit categories. Apply these in combination with the design-system-specific rules in the cached `.claude/design-systems/<name>.md` file.

## Category 1 — Raw HTML vs components

Flag these elements when the chosen design system has a component equivalent:

| Raw element | Likely component |
|---|---|
| `<button>` | Button |
| `<input>` (text, email, password, number, search, url, tel) | Input |
| `<textarea>` | Textarea |
| `<select>` | Select |
| `<dialog>` or `<div role="dialog">` | Dialog / Modal |
| `<details><summary>` | Accordion / Collapsible |
| `<input type="checkbox">` | Checkbox |
| `<input type="radio">` | RadioGroup |
| `<input type="range">` | Slider |
| `<table>` (in app code, not docs) | Table / DataTable |
| `<a>` styled as a button | Button asChild / Link as Button |

**Don't flag:**
- `<div>`, `<span>`, `<p>`, headings (`<h1>`–`<h6>`), `<ul>`, `<ol>`, `<li>`, `<section>`, `<article>`, `<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>`, `<form>`, `<label>`, `<img>`, `<svg>`, `<a>` (plain link).
- Anything inside a file that's clearly the component definition itself (e.g. `components/ui/button.tsx`).

## Category 2 — Hardcoded colors/spacing vs tokens

Flag these patterns:

- Hex colors in any form: `#fff`, `#1a1a1a`, `#1a1a1aff`
- `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)` literals (in style props or CSS-in-JS)
- Pixel values in `style={{}}` props: `padding: '16px'`, `margin: 8`, `width: '320px'`
- Tailwind arbitrary color values: `bg-[#1a1a1a]`, `text-[rgb(0,0,0)]`, `border-[hsl(...)]`
- Tailwind arbitrary spacing values that match a standard scale: `p-[16px]` (should be `p-4`), `mt-[8px]` (should be `mt-2`)

**Don't flag:**
- Color literals inside `tailwind.config.*`, theme files, or token definition files — that's where they belong.
- SVG `fill=` and `stroke=` on icons that are intentionally colored (single-color icons that match a token).
- Transparent values: `transparent`, `currentColor`, `inherit`.
- CSS variables: `var(--foreground)`, `hsl(var(--primary))`.

## Category 3 — Inline styles & arbitrary Tailwind values

Flag:

- Any `style={{}}` prop in JSX/TSX (with the exception list below).
- Tailwind arbitrary values for dimensions: `w-[423px]`, `h-[37px]`, `max-w-[1240px]`.
- Tailwind arbitrary values for typography: `text-[13px]`, `leading-[1.7]`.

**Don't flag:**
- `style` props that compute dynamic values that can't be expressed in classes: `style={{ transform: \`translateX(${x}px)\` }}`, `style={{ '--progress': value }}`.
- Arbitrary values that genuinely have no scale equivalent (e.g. a one-off `top-[37px]` that pixel-matches a design — but flag it anyway and let the user decide).
- Inline styles in email templates or print stylesheets — these often need them.

## Category 4 — Accessibility basics

Flag:

- `<img>` without an `alt` attribute. (`alt=""` is fine — it's an explicit decorative marker.)
- `<button>` with no children, no `aria-label`, and no `aria-labelledby`.
- `<input>` not associated with a `<label>` (no matching `htmlFor`/`id`, no wrapping label, no `aria-label`, no `aria-labelledby`).
- `<div>` or `<span>` with `onClick` but no `role` and no `tabIndex`.
- `<a>` with no `href` (use a button instead) — except when it's clearly a placeholder.
- `<button>` inside a `<form>` with no `type` attribute (defaults to `submit`, often unintended).

**Don't flag:**
- `<img>` inside a component that explicitly handles alt via prop (look one level up).
- Buttons whose only child is an icon component — these usually have `aria-label` set, but confirm by reading the line.

## Category 5 — Component API misuse

This is design-system specific. Read the cached `.claude/design-systems/<name>.md` for the canonical prop names. Common patterns to flag:

- Variant names that don't exist in the design system (e.g. `variant="primary"` when shadcn uses `default`).
- Size prop values outside the allowed enum (e.g. `size="medium"` when only `sm | default | lg` exist).
- Deprecated props the design system has removed.
- Mixing `className` overrides with variant props in ways that defeat the variant (e.g. `<Button variant="ghost" className="bg-blue-500">`).

Be conservative here — only flag things you're confident about based on the design system docs. When in doubt, don't flag.

## How to scan efficiently

For a whole-repo audit:

1. Use `rg` (ripgrep) for the initial pass — it's fast and respects `.gitignore`.
2. Build per-category regex patterns and collect candidate lines first.
3. Then read the actual files for the candidates to confirm context (e.g. is this `<button>` actually inside the Button component definition?).
4. Group results before printing.

Example ripgrep patterns:
- Hex colors: `rg "#[0-9a-fA-F]{3,8}\\b" --type tsx --type jsx --type ts --type js`
- Inline styles: `rg "style=\\{\\{" --type tsx --type jsx`
- Arbitrary Tailwind: `rg "\\[[0-9]+px\\]|\\[#[0-9a-fA-F]+\\]" --type tsx --type jsx`
- Raw buttons: `rg "<button[\\s>]" --type tsx --type jsx`

Don't print every ripgrep result raw — always read the surrounding lines to confirm it's a real violation before adding it to the report.
