# Frontend Design Patterns (Tailwind + shadcn/ui)

Reference patterns using Tailwind CSS and shadcn/ui components.

## Color Configuration

Customize shadcn's CSS variables in `globals.css` for distinctive palettes:

### Warm Minimal
```css
:root {
  --background: 40 20% 98%;
  --foreground: 0 0% 10%;
  --muted: 40 10% 96%;
  --muted-foreground: 0 0% 42%;
  --accent: 15 60% 50%;
  --border: 40 15% 90%;
}
```

### Cool Monochrome
```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 7%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 40%;
  --accent: 0 0% 7%;
  --border: 0 0% 88%;
}
```

### Deep & Grounded (Dark)
```css
:root {
  --background: 0 0% 11%;
  --foreground: 0 0% 96%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 53%;
  --accent: 30 45% 65%;
  --border: 0 0% 20%;
}
```

## shadcn Component Customization

### Button Variants

Override in `components/ui/button.tsx` variants:
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:opacity-85",
        outline: "border border-border bg-transparent hover:border-foreground",
        ghost: "text-muted-foreground hover:text-foreground",
        link: "underline underline-offset-4 decoration-1 hover:decoration-transparent",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8",
      },
    },
  }
)
```

### Input - Minimal
```tsx
// components/ui/input.tsx
<input
  className={cn(
    "flex w-full bg-transparent px-4 py-3 text-sm border border-border",
    "placeholder:text-muted-foreground",
    "focus:border-foreground focus:outline-none",
    "transition-colors",
    className
  )}
  {...props}
/>
```

### Card - No Shadow
```tsx
// Customize Card in components/ui/card.tsx
<div className={cn("bg-background border border-border p-6", className)}>
  {children}
</div>
```

## Layout Patterns

### Page Container
```tsx
<main className="max-w-2xl mx-auto px-6 py-12">
  {/* Readable width content */}
</main>
```

### Wide Container
```tsx
<div className="max-w-6xl mx-auto px-6">
  {/* Full-width content */}
</div>
```

### Sidebar Layout
```tsx
<div className="grid grid-cols-[280px_1fr] min-h-screen">
  <aside className="border-r border-border p-6">
    <nav className="flex flex-col gap-1">
      {/* Nav items */}
    </nav>
  </aside>
  <main className="p-6">{children}</main>
</div>
```

### Asymmetric Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
  <div>{/* Narrow */}</div>
  <div>{/* Wide */}</div>
</div>
```

## Navigation

### Minimal Header
```tsx
<header className="flex items-center justify-between py-4 border-b border-border">
  <a href="/" className="text-lg font-medium">Brand</a>
  <nav className="flex items-center gap-8">
    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
      Link
    </a>
  </nav>
</header>
```

### Sidebar Nav Item
```tsx
<Button
  variant="ghost"
  className={cn(
    "w-full justify-start px-3",
    isActive && "bg-muted font-medium"
  )}
>
  Item
</Button>
```

## Using Radix Primitives via shadcn

### Dialog - Keep it Simple
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent className="max-w-md border border-border shadow-none">
    <DialogHeader>
      <DialogTitle className="text-lg font-medium">Title</DialogTitle>
    </DialogHeader>
    <div className="py-4">Content</div>
    <DialogFooter>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Dropdown Menu - Minimal
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="border border-border shadow-none">
    <DropdownMenuItem className="text-sm">Action</DropdownMenuItem>
    <DropdownMenuSeparator className="bg-border" />
    <DropdownMenuItem className="text-sm text-muted-foreground">Cancel</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Select - Clean
```tsx
<Select>
  <SelectTrigger className="border-border focus:ring-0 focus:border-foreground">
    <SelectValue placeholder="Choose..." />
  </SelectTrigger>
  <SelectContent className="border border-border shadow-none">
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>
```

## Typography

### Heading Hierarchy
```tsx
<h1 className="text-4xl font-semibold tracking-tight">Page Title</h1>
<h2 className="text-2xl font-medium">Section</h2>
<h3 className="text-lg font-medium">Subsection</h3>
<p className="text-base text-muted-foreground leading-relaxed">Body</p>
```

### Large Editorial
```tsx
<h1 className="text-5xl md:text-7xl font-medium tracking-tighter leading-none">
  Statement
</h1>
```

## Detail Elements

### Separator
```tsx
<Separator className="my-8" />
```

### Left Accent
```tsx
<div className="pl-4 border-l-2 border-accent">
  <p>Highlighted content</p>
</div>
```

### Tag/Label
```tsx
<span className="inline-block px-2 py-1 text-xs font-medium uppercase tracking-wider bg-muted">
  Label
</span>
```

### Link - Editorial
```tsx
<a className="underline underline-offset-4 decoration-1 hover:decoration-transparent transition-all">
  Link text
</a>
```

## Empty & Loading States

### Empty State
```tsx
<div className="py-16 text-center">
  <p className="text-muted-foreground">No items yet</p>
  <Button variant="link" className="mt-2">Add first item</Button>
</div>
```

### Skeleton
```tsx
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-4 w-1/2 mt-2" />
```

## Form Patterns

### Form Group
```tsx
<div className="space-y-2">
  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

### Form Stack
```tsx
<form className="space-y-6 max-w-sm">
  {/* Form groups */}
  <Button type="submit" className="w-full">Submit</Button>
</form>
```

## Accessibility Reminders

- Always use `asChild` with Radix triggers for proper semantics
- Include focus-visible styles (shadcn provides these)
- Use `sr-only` for icon-only buttons
- Test keyboard navigation

```tsx
<Button variant="ghost" size="sm">
  <IconTrash className="h-4 w-4" />
  <span className="sr-only">Delete item</span>
</Button>
```
