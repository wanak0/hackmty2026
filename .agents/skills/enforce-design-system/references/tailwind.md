# Tailwind CSS rules

When the codebase uses Tailwind without a component library, the audit focuses on consistent use of the design tokens defined in `tailwind.config.*` and avoidance of arbitrary values.

## Read the config

Before auditing, read `tailwind.config.{js,ts,mjs}` to learn:

- The custom color palette (under `theme.colors` or `theme.extend.colors`).
- Custom spacing scale extensions.
- Custom font families, sizes, line heights.
- Whether the project uses `@theme` (Tailwind v4) or `theme.extend` (v3).

The cached design system file should reflect what's in the config.

## Conventions

### Colors

- Always use named colors from the palette: `bg-zinc-900`, `text-blue-500`, `border-neutral-200`.
- If the project defines semantic tokens (`bg-background`, `text-primary`), prefer those over raw scale colors.
- Never use arbitrary color values in components: `bg-[#1a1a1a]` is a violation. Add the color to the config first.

### Spacing

- Use the standard scale: `p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8`, `p-12`, etc.
- Avoid arbitrary values like `p-[13px]`, `mt-[7px]`. If a one-off value is genuinely needed, it should be rare and justified.

### Sizing

- For widths and heights, use the scale (`w-64`, `h-12`) or fractional/percentage utilities (`w-1/2`, `w-full`).
- `max-w-*` should use the named scale (`max-w-md`, `max-w-2xl`, `max-w-screen-lg`).
- Arbitrary dimensions like `w-[423px]` are violations unless there's a specific layout reason.

### Typography

- Use `text-xs` through `text-9xl` from the scale.
- Use `font-thin` through `font-black` for weights.
- Use `leading-tight`, `leading-normal`, `leading-relaxed`, etc. — avoid `leading-[1.7]`.

### Layout

- Prefer `flex` and `grid` utilities over inline `style={{ display: ... }}`.
- Use `gap-*` instead of margins between siblings.

### Class organization

- If the project uses `prettier-plugin-tailwindcss`, classes should be sorted automatically. Don't flag class order.
- If the project uses `cn()` or `clsx` for conditional classes, prefer that over template strings.

## Common violations to flag

- Arbitrary color values: `bg-[#abc123]`, `text-[rgb(0,0,0)]`.
- Arbitrary spacing that matches a scale value: `p-[16px]` (use `p-4`), `mt-[8px]` (use `mt-2`).
- Arbitrary dimensions in components: `w-[423px]`, `h-[37px]`.
- Inline `style={{}}` props for things that have utility equivalents.
- Hex colors or rgb in `style` props or CSS files (in component scope).
- Mixing custom CSS with Tailwind for the same property (`<div className="p-4" style={{ padding: '16px' }}>`).

## What's NOT a violation

- Arbitrary values for genuinely dynamic computed values (`style={{ transform: \`translateX(${x}px)\` }}`).
- Arbitrary values in the config file itself.
- Arbitrary values in animation/transition timing if the project doesn't define a custom duration scale.
