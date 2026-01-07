---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Frontend Design Skill

Create distinctive, production-quality frontend interfaces that have genuine design merit. Avoid the telltale signs of AI-generated UI.

## Stack

- **Tailwind CSS** for styling
- **shadcn/ui** (Radix primitives) for accessible components
- Extend shadcn components rather than recreating - customize through Tailwind and CSS variables

## Core Principles

### 1. Restraint Over Excess
- **One signature element per component** - pick a single distinctive feature rather than layering effects
- **Flat is often better** - shadows, gradients, and blur should be intentional, not decorative
- **White space is a feature** - generous spacing beats cramped layouts with effects

### 2. Typography First
- **Establish clear hierarchy** through size, weight, and spacing - not just color
- **Use 2 typefaces maximum** - one for headings, one for body (or one for everything)
- **Line height matters** - 1.5-1.7 for body text, tighter for headings
- **Letter-spacing** - slightly negative for large headings, normal or positive for small text

### 3. Color With Purpose
- **Avoid purple/blue gradients** - they scream "AI generated"
- **2-3 colors maximum** - plus neutrals
- **One accent color** - use it sparingly for emphasis
- **Consider unusual palettes** - muted earth tones, monochrome with one pop, warm neutrals

### 4. Intentional Details
- **Consistent border-radius** - pick one value (0, 4px, 8px, or fully round) and commit
- **Border > shadow** for definition - subtle 1px borders feel more refined
- **Hover states should be subtle** - a slight opacity or color shift, not a transformation

## What to Avoid

### Generic AI Patterns
- Card grids with identical rounded corners, shadows, and icons
- Hero sections with centered text, gradient backgrounds, and stock illustrations
- Buttons with gradients, shadows, AND rounded corners
- Everything floating on cards with drop shadows
- Purple-to-blue or pink-to-orange gradients
- Excessive use of blur/glass effects
- Every element animated
- Too many icons - use them strategically

### Layout Clichés
- Perfectly symmetrical everything
- Three-column feature grids
- Giant centered headlines with tiny subtext
- Floating mockups and isometric illustrations

## Design Approaches

Choose ONE approach and commit to it:

### Minimal/Editorial
- Large typography as the primary visual element
- Black/white with one accent
- Generous whitespace
- No cards, minimal shadows
- Grid-based, asymmetric layouts

### Brutalist/Raw
- Exposed structure
- System fonts or monospace
- Hard edges (no border-radius)
- High contrast
- Visible grid lines or borders

### Refined/Subtle
- Muted color palette
- Soft but flat (no gradients)
- Thin borders for definition
- Careful micro-interactions
- Typography-driven hierarchy

### Bold/Expressive
- Strong color choices (not gradients)
- Oversized elements
- Asymmetric layouts
- Custom shapes or illustrations
- Distinct personality

## Implementation Guidelines

### Structure
```
- Semantic HTML (section, article, nav, aside)
- Logical heading hierarchy (h1 > h2 > h3)
- Accessibility: labels, alt text, ARIA when needed
- Mobile-first responsive design
```

### CSS Approach
```
- CSS custom properties for consistent values
- Minimal utility classes - prefer semantic naming
- System font stacks or self-hosted fonts
- Logical properties (margin-block, padding-inline)
```

### Interactions
```
- Subtle transitions (150-200ms ease-out)
- Reduced motion respect (@media prefers-reduced-motion)
- Focus states that are visible but not jarring
- Loading states that don't involve spinners when possible
```

## Before Generating Code

1. **Pick a design direction** from the approaches above
2. **Define the palette** - 2-3 colors max, customize CSS variables
3. **Choose typography** - one or two fonts, define the scale
4. **Set spacing values** - consistent scale throughout
5. **Decide on border-radius** - one value used consistently

See [PATTERNS.md](PATTERNS.md) for Tailwind + shadcn/ui code patterns.

## Quality Checks

Before finishing, verify:
- [ ] Could you identify the design direction if you saw it?
- [ ] Is there visual hierarchy without relying on gradients/shadows?
- [ ] Would this look good in grayscale?
- [ ] Is there one distinctive design choice (not many competing ones)?
- [ ] Does it avoid all the generic AI patterns listed above?
- [ ] Would a designer approve of this?
