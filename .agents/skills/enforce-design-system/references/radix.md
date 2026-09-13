# Radix UI rules

Radix is unstyled, accessible primitives. Every component is composed from a `Root` and its parts.

## Components

Imports come from per-component packages:

```tsx
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';
import * as Popover from '@radix-ui/react-popover';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import * as Accordion from '@radix-ui/react-accordion';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Toast from '@radix-ui/react-toast';
import * as Toolbar from '@radix-ui/react-toolbar';
import * as Avatar from '@radix-ui/react-avatar';
import * as Separator from '@radix-ui/react-separator';
import * as Label from '@radix-ui/react-label';
```

Composition pattern: `Dialog.Root` → `Dialog.Trigger` → `Dialog.Portal` → `Dialog.Overlay` → `Dialog.Content` → `Dialog.Title`, `Dialog.Description`, `Dialog.Close`.

## Component API

- `asChild`: the universal escape hatch. Wrap any element to inherit Radix's behavior. `<Dialog.Trigger asChild><Button>Open</Button></Dialog.Trigger>`.
- Data attributes for state styling: `data-state="open"`, `data-state="closed"`, `data-disabled`, `data-highlighted`.

## Conventions

- Always include `Portal` for overlays (Dialog, Popover, Tooltip, DropdownMenu) — otherwise z-index and stacking get weird.
- Use `asChild` to compose with custom components — don't wrap Radix triggers in extra divs.
- Style states via `data-[state=open]:` selectors, not by tracking state in React.
- Always provide `Title` and `Description` for accessibility on Dialog and AlertDialog.

## Common violations to flag

- Native `<dialog>` or `<div role="dialog">` instead of `Dialog.Root`.
- Native `<select>` instead of `Select.Root`.
- Custom dropdowns built from `<button>` + `<ul>` with manual state — use `DropdownMenu.Root`.
- Missing `Portal` on overlay components.
- Missing `Title` or `Description` on Dialog (a11y).
- Not using `asChild` and instead wrapping triggers in extra elements.
- Tracking open/closed state manually with `useState` instead of using Radix's controlled/uncontrolled props.
