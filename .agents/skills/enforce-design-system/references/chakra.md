# Chakra UI rules

Chakra UI from `@chakra-ui/react`. Component-based with style props.

## Components

Common imports from `@chakra-ui/react`:

- `Button`, `IconButton`, `ButtonGroup`
- `Input`, `Textarea`, `Select`, `NumberInput`
- `Checkbox`, `Radio`, `RadioGroup`, `Switch`, `Slider`
- `FormControl`, `FormLabel`, `FormErrorMessage`, `FormHelperText`
- `Modal`, `ModalOverlay`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter`, `Drawer`
- `Box`, `Flex`, `Stack`, `HStack`, `VStack`, `Grid`, `SimpleGrid`, `Center`, `Container`
- `Heading`, `Text`
- `Card`, `CardHeader`, `CardBody`, `CardFooter`
- `Tabs`, `TabList`, `TabPanels`, `Tab`, `TabPanel`
- `Menu`, `MenuButton`, `MenuList`, `MenuItem`
- `Tooltip`, `Popover`
- `Tag`, `Badge`, `Avatar`
- `Alert`, `Toast` (via `useToast`)
- `Spinner`, `Progress`, `Skeleton`
- `Divider`

## Component API

### Button

- `variant`: `solid | outline | ghost | link` (default: `solid`) — **NOT** `primary`, `default`, `contained`.
- `colorScheme`: any theme color key (`blue`, `red`, `green`, `gray`, etc.) — set color, not variant.
- `size`: `xs | sm | md | lg`.

### Heading / Text

- `size` on Heading: `xs | sm | md | lg | xl | 2xl | 3xl | 4xl`.
- `fontSize`, `fontWeight`, etc. as style props.

## Tokens

Theme defined via `extendTheme()` from `@chakra-ui/react`. Tokens accessed via style props or `useTheme()`.

- Colors: `colorScheme="blue"` or `bg="blue.500"`, `color="gray.700"`.
- Spacing: `p={4}`, `m={2}`, `mt="6"` — uses theme spacing scale (multiples of 4px by default).
- Typography: `fontSize="md"`, `fontWeight="bold"`, `lineHeight="tall"`.

## Conventions

- Use Chakra's style props for everything: `<Box bg="white" p={4} borderRadius="md">`.
- Use layout primitives (`<Stack>`, `<HStack>`, `<VStack>`, `<Flex>`) instead of raw divs with flexbox.
- Use `<Heading>` and `<Text>` for typography, not raw `<h1>` or `<p>`.
- Form fields should be wrapped in `<FormControl>` with `<FormLabel>`.
- Use `colorScheme` to color buttons/badges, not arbitrary `bg` and `color`.

## Common violations to flag

- Raw `<button>` instead of `<Button>`.
- Raw `<input>` instead of `<Input>`.
- Form inputs not wrapped in `<FormControl>` with `<FormLabel>`.
- `<div style={{ display: 'flex' }}>` instead of `<Flex>` or `<HStack>`.
- `variant="primary"` on Button (should be `solid` + `colorScheme`).
- Hardcoded colors like `bg="#1a1a1a"` — should use `bg="gray.900"` or a theme token.
- Inline `style={{}}` on Chakra components — should use style props or `sx`.
- Raw `<h1>`, `<p>` styled with className/style instead of `<Heading>`, `<Text>`.
