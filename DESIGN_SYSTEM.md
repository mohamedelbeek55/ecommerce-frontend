# Design System — E-Commerce Frontend

> Every component/page must use these tokens. Do not introduce a new color, spacing value,
> or font outside what's defined here without updating this file first.

## Design direction

Premium warm e-commerce storefront for furniture and homeware. Light, warm, editorial,
product-focused. Charcoal for text, terracotta reserved for actions/highlights. No bright
blue/purple/neon, no heavy shadows. White product surfaces over the ivory page background.

## Colors

| Token        | Hex       | Tailwind theme name | Use for                                          |
|--------------|-----------|----------------------|-----------------------------------------------------|
| background   | `#FBF7F2` | `background`          | Main page background (warm ivory)                   |
| surface      | `#FFFFFF` | `surface`             | Cards, inputs, badges — prefer over background for products |
| text         | `#1C1917` | `text`                | Headings, primary content                            |
| text-muted   | `#736A63` | `text-muted`          | Descriptions, metadata, nav labels                    |
| primary      | `#B85C38` | `primary`             | Buttons, active tabs, logo accent, key actions        |
| primary-hover| `#96452C` | `primary-hover`       | Hover state for primary CTAs                          |
| border       | `#E7DED4` | `border`              | Card borders, dividers                                |
| hero-tint    | `#EAD9C9` | `hero`                | Hero section background accent                        |
| rating       | `#C1812D` | `rating`              | Star ratings, warm ochre/gold accents                  |
| destructive  | `#A94442` | `destructive`         | Wishlist active state, remove/delete actions           |

> Configure these in `tailwind.config.js` under `theme.extend.colors` so components use
> `bg-primary`, `text-muted`, `border-border` etc. instead of raw hex values.

## Typography

- Modern, minimal, geometric sans-serif for headings (system `font-sans` to start; a
  webfont like Inter or Sora can be added later)
- Body text: `text-muted` for descriptions/metadata, `text` for anything important
- Scale: `text-sm` (metadata/labels), `text-base` (body), `text-lg`/`text-xl` (section
  headings), `text-2xl`/`text-3xl` (page/hero titles) — headings `font-semibold`/`font-bold`

## Spacing & layout

- Tailwind default spacing scale only — no arbitrary values
- Max content width: `max-w-7xl mx-auto px-4`
- Product cards: spacious, image-first, generous padding (`p-4`–`p-6`), lots of white space
  around the image
- Card radius: `rounded-lg`, no heavy shadows — `shadow-sm` at most, rely on `border` color
  for definition

## Components

- **Buttons:** `rounded-md px-4 py-2 font-medium`, slightly rounded (not pill-shaped);
  primary = `bg-primary text-white hover:bg-primary-hover`, secondary = `border border-border
  text-text hover:border-primary`
- **Inputs:** `rounded-md border border-border bg-surface px-3 py-2 focus:ring-2 focus:ring-primary`
- **Product cards:** `bg-surface rounded-lg border border-border p-4`, image on plain/white
  sub-background even over the ivory page background
- **Ratings:** stars in `rating` color, never default yellow/amber
- **Wishlist icon:** outline by default, filled in `destructive` when active

## Accessibility

- Text on `background`/`surface`: `#1C1917` on `#FBF7F2`/`#FFFFFF` — passes AA comfortably
- CTA text: white on `primary` (`#B85C38`) — verify AA at final font-weight/size before ship
- Never rely on color alone for state (e.g. out-of-stock) — pair color with text/icon

## Sample content direction

Niche: **Home & Living** (furniture, decor, kitchenware) — matches the warm/editorial
palette. Avoid tech/electronics mock data.

Suggested categories for seed data (gives natural price/variety spread for testing
pagination, search, filter, and sort):
- Living Room — sofas, coffee tables, lamps
- Bedroom — beds, mattresses, bedding
- Kitchen & Dining — cookware, dining tables
- Decor — mirrors, rugs, vases

Aim for a realistic price range within each category (e.g. a $15 mug next to an $800 sofa)
so price filtering/sorting has something meaningful to demonstrate.

## Dark mode

Not implemented in v1.