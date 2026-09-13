# Base UI rules

Base UI (`@base-ui-components/react`) is an unstyled, accessible component library. Styling is up to the consumer (typically Tailwind or CSS).

## Components

Imports are namespaced. Common patterns:

```tsx
import { Dialog } from '@base-ui-components/react/dialog';
import { Menu } from '@base-ui-components/react/menu';
import { Select } from '@base-ui-components/react/select';
import { Switch } from '@base-ui-components/react/switch';
import { Slider } from '@base-ui-components/react/slider';
import { Tabs } from '@base-ui-components/react/tabs';
import { Popover } from '@base-ui-components/react/popover';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { RadioGroup } from '@base-ui-components/react/radio-group';
import { NumberField } from '@base-ui-components/react/number-field';
import { Field } from '@base-ui-components/react/field';
```

Each export is a namespace with subcomponents: `Dialog.Root`, `Dialog.Trigger`, `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Popup`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`.

## Component API

Base UI components don't have variants — they're unstyled. Common props across components:

- `render`: replace the rendered element (similar to Radix's `asChild`).
- Data attributes for state: `data-open`, `data-checked`, `data-disabled`, `data-pressed` — style with these in CSS or Tailwind (`data-[open]:bg-blue-500`).

## Conventions

- Always use the `Root` -> subcomponent composition. Don't try to render `Dialog` as a single element.
- For modals, always include `Portal` and `Backdrop`.
- Form inputs should be wrapped in `Field.Root` with `Field.Label` and `Field.Control`.
- Style state via data attributes, not by tracking state in your own React state and passing className.

## Common violations to flag

- Native `<dialog>` instead of `Dialog.Root` composition.
- Native `<select>` instead of `Select.Root`.
- Native `<input type="checkbox">` instead of `Checkbox.Root`.
- Form inputs without `Field.Root` wrapping.
- Tracking open/closed state manually instead of using data attributes.
- Inline styles on Base UI components — should be className with state-aware variants.
