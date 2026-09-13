# MUI (Material UI) rules

MUI components from `@mui/material`. Theme-driven, with `sx` prop for one-off styles.

## Components

Common imports from `@mui/material`:

- `Button`, `IconButton`, `ButtonGroup`
- `TextField`, `Input`, `OutlinedInput`, `FilledInput`
- `Select`, `MenuItem`, `Autocomplete`
- `Checkbox`, `Radio`, `RadioGroup`, `Switch`, `Slider`
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Drawer`, `Modal`
- `Card`, `CardContent`, `CardActions`, `CardHeader`, `CardMedia`
- `Typography`
- `Box`, `Stack`, `Grid`, `Container`
- `AppBar`, `Toolbar`
- `Tabs`, `Tab`
- `Menu`, `MenuItem`
- `Tooltip`, `Popover`, `Popper`
- `Chip`, `Badge`, `Avatar`
- `Alert`, `Snackbar`
- `LinearProgress`, `CircularProgress`
- `Skeleton`, `Divider`

## Component API

### Button

- `variant`: `text | outlined | contained` — **NOT** `primary`, `default`, `ghost`.
- `color`: `inherit | primary | secondary | success | error | info | warning`.
- `size`: `small | medium | large`.

### TextField

- `variant`: `outlined | filled | standard`.
- `size`: `small | medium`.

### Typography

- `variant`: `h1`-`h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline`.
- Avoid using raw `<h1>`, `<p>` for styled text — use `<Typography variant="h1">`.

## Tokens

Theme is defined via `createTheme()` and applied via `<ThemeProvider>`. Access via:

- `theme.palette.primary.main`, `theme.palette.text.primary`, etc.
- `theme.spacing(2)` for spacing (multiplier of 8px by default).
- `theme.breakpoints.up('md')` for media queries.
- `theme.typography.h1`, etc.

In `sx` prop: `sx={{ color: 'primary.main', p: 2, mt: { xs: 1, md: 3 } }}`.

## Conventions

- Use `sx` prop for one-off styles, not inline `style`.
- Use `styled()` from `@mui/material/styles` for reusable styled components.
- Use theme tokens via shorthand in `sx`: `p: 2` (not `padding: '16px'`).
- Use `<Box>` and `<Stack>` for layout — avoid raw `<div>` in MUI codebases for layout containers.
- Use `<Typography>` for text — avoid raw `<p>`, `<span>` for styled text.

## Common violations to flag

- Raw `<button>` or styled `<div>` instead of `<Button>` or `<IconButton>`.
- Raw `<input>` instead of `<TextField>`.
- `variant="primary"` on Button (should be `contained`, and color is set via `color` prop).
- `inline style={{}}` on MUI components — use `sx` prop instead.
- Hardcoded spacing values: `padding: '16px'` should be `p: 2` in `sx`.
- Hardcoded colors: `color: '#1976d2'` should be `color: 'primary.main'`.
- Using `<div>` with flexbox for layout when `<Stack>` or `<Box>` would be idiomatic.
- Mixing `style` and `sx` on the same component.
