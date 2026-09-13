# shadcn/ui rules

## Components

shadcn components live in `components/ui/` (or `@/components/ui/`). Common components and their import paths:

- `Button` from `@/components/ui/button`
- `Input` from `@/components/ui/input`
- `Textarea` from `@/components/ui/textarea`
- `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` from `@/components/ui/select`
- `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription` from `@/components/ui/dialog`
- `Checkbox` from `@/components/ui/checkbox`
- `RadioGroup`, `RadioGroupItem` from `@/components/ui/radio-group`
- `Label` from `@/components/ui/label`
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` from `@/components/ui/card`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`
- `Badge` from `@/components/ui/badge`
- `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`
- `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip`
- `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover`
- `Sheet`, `SheetTrigger`, `SheetContent` from `@/components/ui/sheet`
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` from `@/components/ui/dropdown-menu`
- `Switch` from `@/components/ui/switch`
- `Slider` from `@/components/ui/slider`
- `Skeleton` from `@/components/ui/skeleton`
- `Separator` from `@/components/ui/separator`

## Component API

### Button

- `variant`: `default | destructive | outline | secondary | ghost | link` — **NOT** `primary`, `danger`, `tertiary`.
- `size`: `default | sm | lg | icon` — **NOT** `medium`, `large`, `xs`.
- `asChild`: boolean, used to make the trigger a different element (e.g. `<Button asChild><Link /></Button>`).

### Input

- No `variant` prop. Use `className` for size variations. Standard sizing handled by the component.
- `type` is a normal HTML type attribute.

### Badge

- `variant`: `default | secondary | destructive | outline`.

## Tokens

shadcn uses CSS variables defined in `app/globals.css` (or `styles/globals.css`). The token names:

**Colors** (use as `bg-background`, `text-foreground`, etc., or `hsl(var(--background))` in CSS):
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

**Spacing**: use Tailwind's default spacing scale (`p-4`, `gap-2`, etc.). Avoid arbitrary values.

**Radius**: `--radius` variable, used as `rounded-md` (default), `rounded-sm`, `rounded-lg`.

## Conventions

- All components use `cn()` from `@/lib/utils` to merge classes.
- Custom styling on a shadcn component should go through `className` prop, not `style`.
- Don't compose shadcn components by copy-pasting their internals into your page — import the component.
- Use `asChild` instead of wrapping a Button in an `<a>` tag.

## Common violations to flag

- `<button>` instead of `<Button>` (when `@/components/ui/button` exists in the project)
- `variant="primary"` on Button (should be `default`)
- `size="medium"` on Button (should be `default`)
- Hardcoded colors instead of `bg-background`, `text-foreground`, etc.
- `<a className="bg-primary px-4 py-2 rounded-md">` styling a link as a button — use `<Button asChild>`.
- Inline `style={{}}` on shadcn components.
