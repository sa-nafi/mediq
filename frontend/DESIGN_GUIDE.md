# UI Design System & Guidelines

This document outlines the UI principles, styling tokens, and component architecture for this web application. It serves as a context file for AI agents and developers building out additional features or generating new web applications with a cohesive look and feel.

## Design Foundations

### Theme & Aesthetic
- **Style**: Minimalist, high-contrast, Vercel/Linear-inspired.
- **Vibe**: Professional, clean, and highly legible. The aesthetic relies heavily on whitespace, subtle borders, and a monochromatic palette to convey a premium feel.

### Color System
The color system relies exclusively on the **OKLCH** color space to maintain perceptual uniformity. It uses a strictly neutral/monochrome palette (Zinc/Grayscale) with semantic colors used extremely sparingly.

**Light Mode (Root)**
- `background`: Pure white (`oklch(1 0 0)`)
- `foreground`: Near black (`oklch(0.145 0 0)`)
- `card` & `popover`: Pure white (`oklch(1 0 0)`)
- `primary`: Very dark gray (`oklch(0.205 0 0)`)
- `secondary` / `muted` / `accent`: Very light gray (`oklch(0.97 0 0)`)
- `border` / `input`: Light gray (`oklch(0.922 0 0)`)

*Accessibility Note: Background/foreground pairings maintain at least a 4.5:1 contrast ratio to ensure WCAG AA compliance.*

### Typography System
- **Primary Font**: `Geist` (`@fontsource-variable/geist`). Used for both headings and body text.
- **Font Stack**: `"Geist", system-ui, sans-serif`
- **Characteristics**: Use tight tracking (`tracking-tight`) for headings to enhance the modern feel. Body text should prioritize legibility.

### Spacing & Borders
- **Radius**: Base radius is `0.625rem` (10px). Corners are slightly rounded but not pill-shaped.
- **Borders**: Highly dependent on subtle borders (`border-border`) rather than deep shadows to separate content areas. 
- **Shadows**: Keep shadows minimal and crisp; rely on border definitions for structural layout.

## Component Architecture

### Base Components (Shadcn UI)
The project utilizes **shadcn/ui** configured with the `base-nova` style and a `neutral` base color. 
- **Do not build primitives from scratch**. Use the pre-configured components in `@/components/ui`.
- **Icons**: Use `lucide-react`. Ensure icons maintain consistent stroke widths and sizing relative to text.

### Layout Patterns
- **Containers**: Center-aligned containers with generous max-widths.
- **Algorithm/Data Layouts**: Favor two-column layouts on desktop (e.g., configurations on the left sidebar, results/visualizations on the right main pane).
- **Responsive Behavior**: Use Tailwind's default breakpoints (`sm:`, `md:`, `lg:`). Stack columns vertically on mobile screens.

### Animation & Interaction
- **Micro-interactions**: Use `framer-motion` for subtle animations (e.g., page transitions, disclosing new results). 
- **Transitions**: Keep animations fast and purposeful. Use `opacity` fades and slight `y` offsets (`translate-y`) rather than extreme scaling or bouncing.
- **States**: Provide clear visual feedback for `hover`, `active`, `focus`, and `disabled` states using the accent and muted color tokens.

## Tech Stack & Tooling

- **CSS Framework**: Tailwind CSS v4.
- **Token Management**: CSS Variables defined in `index.css` under `:root` and `.dark` selectors.
- **Routing**: React Router DOM. Use `<Suspense>` wrapping for heavy pages.
- **Other Libraries**: `sonner` for notifications, `tanstack-query` for data fetching, `react-hook-form` for form handling, `zod` for schema validation, `shadcn/ui` for components, `lucide-react` for icons, `framer-motion` for animations, `axios` for http requests, `dayjs` for date formatting, `recharts` for charts, `tanstack-table` for tables, `zustand` for state management. [Install and use them only when necessary]

## Instructions for AI Agents
When generating new code or apps based on this guideline:
1. **Never use generic vibrant colors** (red, blue, green) unless it is a specific semantic requirement (e.g., error text). Stick strictly to the neutral/zinc palette.
2. **Prioritize layout alignment**. Ensure padding and margins match flawlessly across adjacent components.
3. **Always use Geist**. Do not fall back to standard browser fonts or other Google fonts unless explicitly requested.
4. **Use Shadcn components**. If an interactive element is needed (dropdown, table, button, input), import it from the existing `ui` folder.
5. **Ensure Dark Mode compatibility**. All custom components must include `dark:` variant classes if they don't use standard foreground/background semantic variables.
