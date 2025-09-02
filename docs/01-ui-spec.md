
# UI Specification – My Third Place

## Global Design Language

- **Font:** DM Sans (primary), Space Mono (code)
- **Theme Colors:** Defined in `02-theme.css` (light/dark support)
- **Border Radius:** 1rem
- **Visual Aesthetic:** Bold but friendly. Clean grid-based layouts.

---

## Key UI Components

### 🧭 Navigation
- Bottom Tab Bar (mobile)
- Side Navigation (desktop)
- Context-aware nav for admin vs user roles

---

## 🎴 Card Components

### Tilted Card (via ReactBits)
- Used for displaying community and event previews.
- Hover/touch tilt interaction.
- Props:
  - `title`
  - `description`
  - `imageUrl`
  - `onClick`

Used in:
- `/events`
- `/communities`
- `/community/:id`

---

## 🖼️ Gallery Display

### Circular Gallery (via ReactBits)
- Used for displaying media galleries in past events or community photos.
- Auto-scroll, zoom-on-hover support.
- Used in:
  - `/events/:id`
  - `/community/:id/gallery`

---

## 🛑 Error Handling

All pages and components gracefully degrade using:
- `<ErrorBoundary />` at route and component level
- `<SkeletonLoader />` during loading states
- `<RetryButton />` on transient failure
- `<EmptyState />` when no data available

Example states:
- No events found
- Discussion expired
- Failed to load community
- Payment failed

---

## Admin Panel (`admin.mythirdplace`)

- Tables: users, events, communities, discussions, flags
- Analytics dashboard with usage charts
- Manual override controls (flags, discussion expiry, etc.)
- Toggle switches (e.g., show participants in frontend)

