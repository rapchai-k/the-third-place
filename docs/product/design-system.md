# Design System: Urban Elegance

"The Third Place" employs a design language focused on community connection, warmth, and modern urban sophistication.

## 1. Core Principles
- **Mobile-First**: Navigation and interactions are optimized for touch and bottom-thumb reach.
- **Glassmorphism**: Subtle translucency to create depth without clutter.
- **Clean Grids**: Content is organized in predictable, pleasing cards and grids.

## 2. Color Palette
Defined in `globals.css` using HSL variables for easy theming.

### Light Mode
- **Background**: Soft Off-White (`210 40% 98%`)
- **Primary**: Deep Midnight Blue (`224 64% 12%`) - Navigation, strong actions.
- **Accent**: Muted Gold / Bronze (`38 45% 55%`) - Highlights, badges.
- **Text**: Deep Charcoal (`224 71% 4%`) - High contrast readability.

### Dark Mode
- **Background**: Deepest Midnight (`224 71% 4%`)
- **Primary**: Off-White (`210 40% 98%`) - Reversal for contrast.
- **Glass**: `rgba(11, 23, 54, 0.6)` - Dark translucent overlays.

## 3. Typography
- **Headings**: `Playfair Display` - Elegant, serif, editorial feel.
- **Body**: `DM Sans` - Clean, modern, highly legible.
- **Code/Tech**: `Space Mono` - For technical data or unique badges.

## 4. UI Library
We use **Shadcn UI** (Radix Primitives + Tailwind) as the foundation.

### Common Components
- **Buttons**: Rounded (`--radius: 0.75rem`), utilizing primary/secondary variants.
- **Cards**: `TiltedCard` for events (interactive 3D effect), Standard Shadcn `Card` for lists.
- **Navigation**: 
  - Mobile: Fixed Bottom Bar (Home, Communities, Events, Profile).
  - Desktop: Side Navigation.

## 5. Animation
- **Tailwind Animate**: Used for foundational fades and slides.
- **Framer Motion**: Used for complex interactions (page transitions, card layout shifts).
- **Tokens**:
  - `transition-smooth`: `all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)`
  - `transition-bounce`: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`
